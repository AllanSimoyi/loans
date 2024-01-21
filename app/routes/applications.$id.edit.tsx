import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import type { z } from 'zod';
import type { KycDocSchema } from '~/models/application.validations';

import { json, redirect } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';

import {
  ActionContextProvider,
  useForm,
} from '~/components/ActionContextProvider';
import { BankDetails } from '~/components/BankDetails';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { CenteredView } from '~/components/CenteredView';
import { Credentials } from '~/components/Credentials';
import { InlineAlert } from '~/components/InlineAlert';
import { LoanDetails } from '~/components/LoanDetails';
import { NextOfKinDetails } from '~/components/NextOfKinDetails';
import { PersonalDetails } from '~/components/PersonalDetails';
import { PrimaryButton } from '~/components/PrimaryButton';
import { PriorLoanDetails } from '~/components/PriorLoanDetails';
import { Toolbar } from '~/components/Toolbar';
import { UploadDocuments } from '~/components/UploadDocuments';
import { WorkDetails } from '~/components/WorkDetails';
import { prisma } from '~/db.server';
import { useUploadKycDoc } from '~/hooks/useUploadKycDoc';
import { editApplication } from '~/models/application.server';
import {
  EditApplicationSchema,
  KycDoc,
  TransformedEditApplicationSchema,
} from '~/models/application.validations';
import { UserType } from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  getValidatedId,
  processBadRequest,
} from '~/models/core.validations';
import { DATE_INPUT_FORMAT } from '~/models/dates';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields } from '~/models/forms';
import { AppLinks } from '~/models/links';
import { requireUser } from '~/session.server';
import { useOptionalUser } from '~/utils';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const currentUser = await requireUser(request);

  if (currentUser.kind === UserType.Lender) {
    throw new Response("You're not authorised to edit applications", {
      status: StatusCode.Unauthorised,
    });
  }

  const id = getValidatedId(params.id);
  const [application, lenders] = await Promise.all([
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
        return {
          ...application,
          channels: application.channels.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          ),
        };
      }),
    prisma.lender
      .findMany({ select: { id: true, user: { select: { fullName: true } } } })
      .then((lenders) =>
        lenders.map((lender) => ({
          id: lender.id,
          lenderName: lender.user.fullName,
        })),
      ),
  ]);
  if (!application) {
    throw new Response('Application not found', {
      status: StatusCode.NotFound,
    });
  }

  if (
    currentUser.kind === UserType.Applicant &&
    application.applicantId !== currentUser.id
  ) {
    throw new Response('This application belongs to another applicant', {
      status: StatusCode.Forbidden,
    });
  }

  return json({ application, lenders });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const currentUser = await requireUser(request);

  if (currentUser.kind === UserType.Lender) {
    throw new Response("You're not authorised to edit applications", {
      status: StatusCode.Unauthorised,
    });
  }

  try {
    const id = getValidatedId(params.id);
    const fields = await getRawFormFields(request);
    const result = TransformedEditApplicationSchema.safeParse(fields);
    if (!result.success) {
      console.log('error', result.error);
      console.log('fields', fields);
      return processBadRequest(result.error, fields);
    }
    const input = result.data;

    const application = await prisma.application.findUnique({
      where: { id },
      select: { applicantId: true },
    });
    if (!application) {
      throw new Response('Application not found', {
        status: StatusCode.NotFound,
      });
    }

    if (
      currentUser.kind === UserType.Applicant &&
      application.applicantId !== currentUser.id
    ) {
      throw new Response('This application belongs to another applicant', {
        status: StatusCode.Forbidden,
      });
    }

    const missing = [KycDoc.NationalID, KycDoc.ProofOfResidence, KycDoc.PaySlip]
      .map((label) => ({
        label,
        doc: input.kycDocs.find((kycDoc) => kycDoc.label === label),
      }))
      .filter(({ doc }) => !doc);

    if (missing.length) {
      return badRequest({
        fieldErrors: {
          kycDocs: [`Missing: ${missing.map((doc) => doc.label).join(', ')}`],
        },
      });
    }

    await editApplication({ ...input, applicationId: id });
    return redirect(AppLinks.Applications);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function ApplicationsIdEdit() {
  const user = useOptionalUser();
  const { application, lenders } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const isProcessing = nav.formMethod === 'post';

  const fetcherObj = { data: actionData, state: nav.state };
  const { getNameProp } = useForm(fetcherObj, EditApplicationSchema);

  function getKyc(label: string) {
    return application.kycDocs.find((doc) => doc.label === label);
  }

  const nationalIdKyc = useUploadKycDoc({
    initialPublicId: getKyc(KycDoc.NationalID)?.publicId || '',
  });
  const proofOfResidenceKyc = useUploadKycDoc({
    initialPublicId: getKyc(KycDoc.ProofOfResidence)?.publicId || '',
  });
  const paySlipKyc = useUploadKycDoc({
    initialPublicId: getKyc(KycDoc.PaySlip)?.publicId || '',
  });
  const letterFromEmployerKyc = useUploadKycDoc({
    initialPublicId: getKyc(KycDoc.LetterFromEmployer)?.publicId || '',
  });
  const bankStatementKyc = useUploadKycDoc({
    initialPublicId: getKyc(KycDoc.BankStatement)?.publicId || '',
  });

  const kycDocs: z.infer<typeof KycDocSchema>[] = [
    { publicId: nationalIdKyc.publicId, label: KycDoc.NationalID },
    { publicId: proofOfResidenceKyc.publicId, label: KycDoc.ProofOfResidence },
    { publicId: paySlipKyc.publicId, label: KycDoc.PaySlip },
    {
      publicId: letterFromEmployerKyc.publicId,
      label: KycDoc.LetterFromEmployer,
    },
    { publicId: bankStatementKyc.publicId, label: KycDoc.BankStatement },
  ];

  const defaultValues: Record<
    keyof z.infer<typeof EditApplicationSchema>,
    string | undefined
  > = {
    applicationId: application.id.toString(),
    emailAddress: application.applicant.emailAddress,
    password: '',
    passwordConfirmation: '',

    selectedLenderId: application.channels[0]?.lenderId.toString() || '',
    moreDetail: application.moreDetail,

    bank: application.bank,
    bankBranch: application.bankBranch,
    accNumber: application.accNumber,
    accName: application.accName,

    loanPurpose: application.loanPurpose,
    amtRequired: application.amtRequired,
    repaymentPeriod: application.repaymentPeriod.toString(),

    title: application.title,
    fullName: application.fullName,
    DOB: dayjs(application.DOB).format(DATE_INPUT_FORMAT),
    nationalID: application.nationalID,
    phoneNumber: application.phoneNumber,
    resAddress: application.resAddress,
    natureOfRes: application.natureOfRes,

    fullMaidenNames: application.fullMaidenNames || '',
    fullNameOfSpouse: application.fullNameOfSpouse || '',
    maritalStatus: application.maritalStatus,

    profession: application.profession,
    employer: application.employer,
    employedSince: dayjs(application.employedSince).format(DATE_INPUT_FORMAT),
    grossIncome: application.grossIncome,
    netIncome: application.netIncome,

    firstNokFullName: application.firstNokFullName,
    firstNokRelationship: application.firstNokRelationship,
    firstNokEmployer: application.firstNokEmployer,
    firstNokResAddress: application.firstNokResAddress,
    firstNokPhoneNumber: application.firstNokPhoneNumber,

    secondNokFullName: application.secondNokFullName,
    secondNokRelationship: application.secondNokRelationship,
    secondNokEmployer: application.secondNokEmployer,
    secondNokResAddress: application.secondNokResAddress,
    secondNokPhoneNumber: application.secondNokPhoneNumber,

    kycDocs: JSON.stringify([
      {
        label: KycDoc.NationalID,
        publicId: 'h2bkwgii1e28hltu7f99',
      },
      {
        label: KycDoc.PaySlip,
        publicId: 'h2bkwgii1e28hltu7f99',
      },
      {
        label: KycDoc.LetterFromEmployer,
        publicId: 'h2bkwgii1e28hltu7f99',
      },
    ]),
    priorLoanLender: application.priorLoans[0]?.lender || '',
    priorLoanExpiryDate: dayjs(
      application.priorLoans[0]?.expiryDate || '',
    ).format(DATE_INPUT_FORMAT),
    priorLoanAmount: application.priorLoans[0]?.amount || '',
    priorLoanMonthlyRepayment:
      application.priorLoans[0]?.monthlyRepayment || '',
    priorLoanBalance: application.priorLoans[0]?.balance || '',
  };

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={user} />
      <CenteredView innerProps={{ className: twMerge('lg:w-[50%]') }}>
        <div className="flex flex-col items-stretch gap-4 px-4 py-8">
          {actionData?.formError && (
            <InlineAlert>{actionData.formError}</InlineAlert>
          )}
          <div className="flex flex-col items-center justify-center p-4">
            <span className="text-base font-semibold">Edit Application</span>
          </div>
          <Form method="post" className="flex flex-col items-stretch gap-6">
            <ActionContextProvider
              {...actionData}
              fields={actionData?.fields || defaultValues}
              isSubmitting={isProcessing}
            >
              <input
                type="hidden"
                {...getNameProp('applicationId')}
                value={defaultValues.applicationId}
              />
              <PersonalDetails actionData={fetcherObj} />
              <LoanDetails actionData={fetcherObj} lenders={lenders} />
              <BankDetails actionData={fetcherObj} />
              <WorkDetails actionData={fetcherObj} />
              <input
                type="hidden"
                {...getNameProp('kycDocs')}
                value={JSON.stringify(kycDocs.filter((doc) => doc.publicId))}
              />
              <UploadDocuments
                nationalIdKyc={nationalIdKyc}
                proofOfResidenceKyc={proofOfResidenceKyc}
                paySlipKyc={paySlipKyc}
                letterFromEmployerKyc={letterFromEmployerKyc}
                bankStatementKyc={bankStatementKyc}
              />
              <NextOfKinDetails actionData={fetcherObj} />
              <PriorLoanDetails
                actionData={fetcherObj}
                isOpen={
                  !!application.priorLoans.length &&
                  !!application.priorLoans[0].lender
                }
              />
              {!user && <Credentials actionData={fetcherObj} />}
              <div className="flex flex-col items-center justify-center">
                <PrimaryButton type="submit" disabled={isProcessing}>
                  {isProcessing ? 'Sending...' : 'Submit Application'}
                </PrimaryButton>
              </div>
            </ActionContextProvider>
          </Form>
        </div>
      </CenteredView>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
