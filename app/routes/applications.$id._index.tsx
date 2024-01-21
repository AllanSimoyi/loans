import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import type { FormEvent } from 'react';

import { json, redirect } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from '@remix-run/react';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import { useForm } from '~/components/ActionContextProvider';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { Breadcrumb } from '~/components/Breadcrumb';
import { Card } from '~/components/Card';
import { CardSection } from '~/components/CardSection';
import { CenteredView } from '~/components/CenteredView';
import { DangerButton } from '~/components/DangerButton';
import { KycImage } from '~/components/KycImage';
import { PrimaryButton, PrimaryButtonLink } from '~/components/PrimaryButton';
import { Toolbar } from '~/components/Toolbar';
import { prisma } from '~/db.server';
import {
  ApplicationState,
  getDecisionColor,
} from '~/models/application.validations';
import { UserType } from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  getValidatedId,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields } from '~/models/forms';
import { AppLinks } from '~/models/links';
import { requireUser } from '~/session.server';
import { useUser } from '~/utils';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const currentUser = await requireUser(request);

  const id = getValidatedId(params.id);
  const [application, lender] = await Promise.all([
    prisma.application
      .findUnique({
        where: { id },
        include: {
          applicant: true,
          channels: {
            include: {
              lender: { include: { user: true } },
              decisions: true,
            },
          },
          kycDocs: true,
          priorLoans: true,
        },
      })
      .then((application) => {
        if (!application) {
          return undefined;
        }
        const channels = application.channels.map((channel) => {
          const decisions = channel.decisions.map((decision) => {
            const result = z
              .nativeEnum(ApplicationState)
              .safeParse(decision.decision);
            if (!result.success) {
              console.log(
                'invalid decision value found for decision with id',
                decision.id,
                'and decision ',
                decision.decision,
              );
              throw new Error(
                'Invalid value for application decision found, please contact our support team',
              );
            }
            return { ...decision, decision: result.data };
          });
          return { ...channel, decisions };
        });
        return { ...application, channels };
      }),
    currentUser.kind === UserType.Lender
      ? prisma.lender.findFirst({
          where: { userId: currentUser.id },
          select: { id: true },
        })
      : undefined,
  ]);
  if (!application) {
    throw new Response('Application not found', {
      status: StatusCode.NotFound,
    });
  }

  if (currentUser.kind === UserType.Lender) {
    if (!lender) {
      throw new Response(
        'Lender record not found, please contact our support system',
        { status: StatusCode.NotFound },
      );
    }
    if (application.channels.every((c) => c.lenderId !== lender.id)) {
      throw new Response('Application was made to a different lender', {
        status: StatusCode.Unauthorised,
      });
    }
  }

  if (
    currentUser.kind === UserType.Applicant &&
    application.applicantId !== currentUser.id
  ) {
    throw new Response('Application was made by a different user', {
      status: StatusCode.Forbidden,
    });
  }

  return json({ application, lenderId: lender?.id });
}

enum ActionId {
  Approve = 'Approve',
  Decline = 'Decline',
  Delete = 'Delete',
}

const Schema = z.object({
  actionId: z.nativeEnum(ActionId),
});
export async function action({ request, params }: ActionFunctionArgs) {
  const currentUser = await requireUser(request);

  try {
    const id = getValidatedId(params.id);
    const [application, lender] = await Promise.all([
      prisma.application.findUnique({
        where: { id },
        select: {
          applicantId: true,
          channels: { select: { id: true, lenderId: true } },
        },
      }),
      prisma.lender.findFirst({
        where: { userId: currentUser.id },
        select: { id: true },
      }),
    ]);
    if (!application) {
      return badRequest({ formError: 'Application not found' });
    }

    if (currentUser.kind === UserType.Lender) {
      if (!lender) {
        return badRequest({
          formError:
            'Lender record not found, please contact our support system',
        });
      }
      if (application.channels.every((c) => c.lenderId !== lender.id)) {
        return badRequest({
          formError: 'Application was made to a different lender',
        });
      }
    }

    if (
      currentUser.kind === UserType.Applicant &&
      application.applicantId !== currentUser.id
    ) {
      return badRequest({
        formError: 'Application was made by a different user',
      });
    }

    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return processBadRequest(result.error, fields);
    }
    const { actionId } = result.data;

    if (actionId === ActionId.Delete) {
      if (currentUser.kind === UserType.Lender) {
        return badRequest({
          formError: "You're not authorised to delete this application",
        });
      }
      await prisma.application.update({
        where: { id },
        data: { deactivated: true },
      });
      console.log('deactivated application', id);
      return redirect(
        `${AppLinks.Applications}?message=Application_deleted_successfully`,
      );
    }

    if (currentUser.kind !== UserType.Lender) {
      return badRequest({
        formError: 'You have to be a lender to approve applications',
      });
    }
    if (!lender) {
      return badRequest({ formError: 'Lender record not found' });
    }

    const channel = await (() => {
      if (application.channels.length) {
        return application.channels[0];
      }
      return prisma.channel.create({
        data: { applicationId: id, lenderId: lender.id },
        select: { id: true, lenderId: true },
      });
    })();

    const decision =
      actionId === ActionId.Approve
        ? ApplicationState.Approved
        : ApplicationState.Declined;

    await prisma.decision.create({
      data: {
        channelId: channel.id,
        decision,
        comment: '',
      },
    });
    return redirect(AppLinks.Applications);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function ApplicationsId() {
  const currentUser = useUser();
  const { application } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const submit = useSubmit();
  const nav = useNavigation();

  const { getNameProp, isProcessing } = useForm(
    { data: actionData, state: nav.state },
    Schema,
  );

  const personalDetails: [string, string][] = [
    ['Full Name', application.fullName],
    ['Date of Birth', dayjs(application.DOB).format('DD/MM/YYYY')],
    ['National ID', application.nationalID],
    ['Phone Number', application.phoneNumber],
    ['Marital Status', application.maritalStatus],
    ['Residential Address', application.resAddress],
    ['Nature of Residence', application.natureOfRes],
  ];

  const loanDetails: [string, string][] = [
    ['Loan Purpose', application.loanPurpose],
    ['Amount Required', `ZWL ${Number(application.amtRequired).toFixed(2)}`],
    ['Repayment Period', `${application.repaymentPeriod} months`],
    ['Description', application.moreDetail],
  ]
    .filter((el) => !!el[1])
    .map((el) => el as [string, string]);

  const bankDetails: [string, string][] = [
    ['Bank', application.bank],
    ['Bank Branch', application.bankBranch],
    ['Account Number', application.accNumber],
    ['Account Name', application.accName],
  ];

  const workDetails: [string, string][] = [
    ['Employer', application.employer],
    ['Profession', application.profession],
    ['Employed Since', dayjs(application.employedSince).format('DD/MM/YYYY')],
    [
      'Gross Monthly Income',
      `ZWL ${Number(application.grossIncome).toFixed(2)}`,
    ],
    ['Net Monthly Income', `ZWL ${Number(application.netIncome).toFixed(2)}`],
  ];

  const firstNextOfKinDetails: [string, string][] = [
    ['Full Name', application.firstNokFullName],
    ['Relationship', application.firstNokRelationship],
    ['Residential Address', application.firstNokResAddress],
    ['Phone Number', application.firstNokPhoneNumber],
    ['Employer', application.firstNokEmployer],
  ];

  const secondNextOfKinDetails: [string, string][] = [
    ['Full Name', application.secondNokFullName],
    ['Relationship', application.secondNokRelationship],
    ['Residential Address', application.secondNokResAddress],
    ['Phone Number', application.secondNokPhoneNumber],
    ['Employer', application.secondNokEmployer],
  ];

  const priorLoanDetails: [string, string][] =
    application && application.priorLoans.length > 0
      ? [
          ['Lender', application.priorLoans[0].lender],
          [
            'Expiry Date',
            dayjs(application.priorLoans[0].expiryDate).format('DD/MM/YYYY'),
          ],
          [
            'Amount',
            `ZWL ${Number(application.priorLoans[0].amount).toFixed(2)}`,
          ],
          [
            'Monthly Repayment',
            `ZWL ${Number(application.priorLoans[0].monthlyRepayment).toFixed(
              2,
            )}`,
          ],
          [
            'Balance',
            `ZWL ${Number(application.priorLoans[0].balance).toFixed(2)}`,
          ],
        ]
      : [];

  function handleDeleteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window) {
      return;
    }
    const confirmed = window.confirm('Are you sure');
    if (!confirmed) {
      return;
    }
    submit(event.currentTarget);
  }

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={currentUser} />
      <CenteredView
        innerProps={{
          className: twMerge('gap-4 px-4 py-8 w-full md:w-[80%] lg:w-[60%]'),
        }}
      >
        <Card>
          <CardSection
            className="flex flex-row items-stretch gap-2"
            noBottomBorder
          >
            <div className="flex flex-col items-start justify-center">
              <Breadcrumb
                items={[
                  { link: AppLinks.Applications, label: 'Applications' },
                  application.fullName,
                ]}
              />
              <span className="text-sm font-light">
                Applied On {dayjs(application.createdAt).format('DD/MM/YYYY')}
              </span>
            </div>
            <div className="grow" />
            {currentUser.kind === UserType.Admin && (
              <div className="flex flex-col items-stretch gap-4 py-2 md:flex-row">
                <div className="flex grow flex-col items-stretch">
                  <PrimaryButtonLink
                    to={AppLinks.EditApplication(application.id)}
                    type="submit"
                  >
                    Edit Application
                  </PrimaryButtonLink>
                </div>
                <Form
                  method="post"
                  className="flex grow flex-col items-stretch"
                  onSubmit={handleDeleteSubmit}
                >
                  <input
                    type="hidden"
                    {...getNameProp('actionId')}
                    value={ActionId.Delete}
                  />
                  <DangerButton type="submit" disabled={isProcessing}>
                    Delete
                  </DangerButton>
                </Form>
              </div>
            )}
            {currentUser.kind === UserType.Lender && (
              <div className="flex flex-col items-stretch gap-4 py-2 md:flex-row">
                <div className="flex grow flex-col items-stretch">
                  <Form method="post">
                    <input
                      type="hidden"
                      {...getNameProp('actionId')}
                      value={ActionId.Approve}
                    />
                    <PrimaryButton type="submit" disabled={isProcessing}>
                      Approve
                    </PrimaryButton>
                  </Form>
                </div>
                <div className="flex grow flex-col items-stretch">
                  <Form method="post">
                    <input
                      type="hidden"
                      {...getNameProp('actionId')}
                      value={ActionId.Decline}
                    />
                    <PrimaryButton
                      className="bg-red-600 hover:bg-red-800"
                      type="submit"
                      disabled={isProcessing}
                    >
                      Decline
                    </PrimaryButton>
                  </Form>
                </div>
              </div>
            )}
          </CardSection>
        </Card>
        <Card>
          <CardSection className="flex flex-row items-center gap-2">
            <h3>Responses By Lenders</h3>
            <div className="grow" />
            {currentUser.kind === UserType.Admin && (
              <PrimaryButtonLink
                to={AppLinks.ApplicationLenders(application.id)}
              >
                Forward To Other Lenders
              </PrimaryButtonLink>
            )}
          </CardSection>
          <CardSection noBottomBorder>
            {application.channels.map((channel) => {
              return (
                <div key={channel.id} className="flex flex-col items-stretch">
                  {channel.decisions.map((decision) => (
                    <Decision
                      key={decision.id}
                      lender={channel.lender.user.fullName}
                      decision={decision.decision}
                      createdAt={decision.createdAt}
                      comment={decision.comment}
                    />
                  ))}
                  {!channel.decisions.length && (
                    <Decision
                      lender={channel.lender.user.fullName}
                      decision={ApplicationState.Pending}
                      createdAt={channel.createdAt}
                      comment="A decision hasn't been made yet"
                    />
                  )}
                </div>
              );
            })}
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <span>Personal Details</span>
          </CardSection>
          <CardSection
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            noBottomBorder
          >
            {personalDetails.map((detail, index) => (
              <LabeledDetail key={index} details={detail} />
            ))}
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <span>Loan Details</span>
          </CardSection>
          <CardSection
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            noBottomBorder
          >
            {loanDetails.map((detail, index) => (
              <LabeledDetail key={index} details={detail} />
            ))}
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <span>Bank Details</span>
          </CardSection>
          <CardSection
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            noBottomBorder
          >
            {bankDetails.map((detail, index) => (
              <LabeledDetail key={index} details={detail} />
            ))}
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <span>Work Details</span>
          </CardSection>
          <CardSection
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            noBottomBorder
          >
            {workDetails.map((detail, index) => (
              <LabeledDetail key={index} details={detail} />
            ))}
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <span>KYC Documents</span>
          </CardSection>
          <CardSection
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            noBottomBorder
          >
            {application.kycDocs.map((doc) => (
              <KycImage
                key={doc.id}
                id={doc.id}
                publicId={doc.publicId}
                label={doc.label}
              />
            ))}
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <span>First Next Of Kin</span>
          </CardSection>
          <CardSection
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            noBottomBorder
          >
            {firstNextOfKinDetails.map((detail, index) => (
              <LabeledDetail key={index} details={detail} />
            ))}
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <span>Second Next Of Kin</span>
          </CardSection>
          <CardSection
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
            noBottomBorder
          >
            {secondNextOfKinDetails.map((detail, index) => (
              <LabeledDetail key={index} details={detail} />
            ))}
          </CardSection>
        </Card>
        {!!priorLoanDetails.length && (
          <Card>
            <CardSection>
              <span>Prior Loan Details</span>
            </CardSection>
            <CardSection
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
              noBottomBorder
            >
              {priorLoanDetails.map((detail, index) => (
                <LabeledDetail key={index} details={detail} />
              ))}
            </CardSection>
          </Card>
        )}
      </CenteredView>
    </div>
  );
}

function Decision(props: {
  lender: string;
  decision: ApplicationState;
  createdAt: Date | string;
  comment: string | undefined;
}) {
  const { lender, decision, createdAt, comment } = props;

  return (
    <div className="flex flex-col items-stretch py-2">
      <div className="flex flex-row items-center gap-2">
        <span>{lender}</span>
        <span>&middot;</span>
        <span className={getDecisionColor(decision)}>{decision}</span>
        <span>&middot;</span>
        <span>{dayjs(createdAt).format('DD/MM/YYYY')}</span>
      </div>
      {!!comment && (
        <span className="text-sm font-light text-stone-600">"{comment}"</span>
      )}
    </div>
  );
}

interface Props {
  details: [string, string];
}
function LabeledDetail(props: Props) {
  const {
    details: [label, detail],
  } = props;
  return (
    // <div className="flex flex-col items-stretch rounded bg-stone-100 p-2">
    <div className="flex flex-col items-stretch">
      <span className="text-xs font-light text-stone-600">{label}</span>
      <span className="text-stone-600">{detail}</span>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
