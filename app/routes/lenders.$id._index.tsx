import type { FormEvent } from 'react';

import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from '@remix-run/react';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import { useForm } from '~/components/ActionContextProvider';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { Card } from '~/components/Card';
import { CardSection } from '~/components/CardSection';
import { CenteredView } from '~/components/CenteredView';
import { DangerButton } from '~/components/DangerButton';
import { GhostButtonLink } from '~/components/GhostButton';
import { LabeledDetail } from '~/components/LabeledDetail';
import { PrimaryButtonLink } from '~/components/PrimaryButton';
import { Toolbar } from '~/components/Toolbar';
import { prisma } from '~/db.server';
import { ApplicationState } from '~/models/application.validations';
import { UserType } from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  getValidatedId,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { AppLinks } from '~/models/links';
import { requireUser } from '~/session.server';
import { useUser } from '~/utils';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.kind !== UserType.Admin) {
    throw new Response("You're not authorised to view this page", {
      status: StatusCode.Forbidden,
    });
  }

  const id = getValidatedId(params.id);
  const lender = await prisma.lender.findUnique({
    where: { id },
    include: {
      user: true,
      employmentPreferences: { include: { employmentType: true } },
      channels: { include: { decisions: true } },
    },
  });
  if (!lender) {
    throw new Response('Lender record not found', {
      status: StatusCode.NotFound,
    });
  }

  return json({ lender });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.kind !== UserType.Admin) {
    throw new Response("You're not authorised to view this page", {
      status: StatusCode.Forbidden,
    });
  }

  try {
    const id = getValidatedId(params.id);
    await prisma.lender.update({
      where: { id },
      data: { deactivated: true },
    });
    return redirect(AppLinks.Lenders);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function LendersIdIndex() {
  const user = useUser();
  const { lender } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const submit = useSubmit();
  const nav = useNavigation();
  const { isProcessing } = useForm(
    { data: actionData, state: nav.state },
    z.object({}),
  );

  const firstDetailSet: [string, string][] = [
    [
      'Employment Types',
      lender.employmentPreferences
        .map((pref) => pref.employmentType.employmentType)
        .join(', ') || '-',
    ],
    ['Min Tenure', `${lender.minTenure} months`],
    ['Max Tenure', `${lender.maxTenure} months`],
    ['Min Amount', `ZWL ${Number(lender.minAmount).toFixed(2)}`],
    ['Max Amount', `ZWL ${Number(lender.maxAmount).toFixed(2)}`],
    ['Monthly Interest', `${Number(lender.monthlyInterest).toFixed(2)}%`],
    ['Admin Fee', `${Number(lender.adminFee).toFixed(2)}%`],
    ['Application Fee', `${Number(lender.applicationFee).toFixed(2)}%`],
  ];

  const decisions =
    lender.channels
      .map(
        (channel) =>
          channel.decisions.sort((a, b) => b.id - a.id)[0] ?? undefined,
      )
      .filter((decision) => !!decision)
      .map((decision) => decision.decision) || [];

  const numApplications = lender.channels.length || 0;
  const numApproved = decisions.filter(
    (decision) => decision === ApplicationState.Approved,
  ).length;
  const numDeclined = decisions.filter(
    (decision) => decision === ApplicationState.Declined,
  ).length;
  const numPending = numApplications - numApproved - numDeclined;

  const secondDetailSet: [string, string][] = [
    ['Full Name', lender.user.fullName],
    ['Email Address', lender.user.emailAddress],
    ['# of Applications', numApplications.toString()],
    ['# of Approved', numApproved.toString()],
    ['# of Declined', numDeclined.toString()],
    ['# of Pending', numPending.toString()],
  ];

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
      <Toolbar currentUser={user} />
      <CenteredView
        innerProps={{
          className: twMerge('gap-4 py-4 px-4 w-full md:w-[80%] lg:w-[60%]'),
        }}
      >
        <Card>
          <CardSection className="flex items-center gap-2 py-2 lg:flex-row lg:gap-10">
            <span>{lender.user.fullName}</span>
            <div className="grow" />
            <div className="flex flex-col items-stretch">
              <GhostButtonLink to={AppLinks.ChangeLenderPassword(lender.id)}>
                Change Password
              </GhostButtonLink>
            </div>
            <div className="flex flex-col items-stretch">
              <GhostButtonLink to={AppLinks.LenderEmploymentTypes(lender.id)}>
                Employment Types
              </GhostButtonLink>
            </div>
          </CardSection>
          <CardSection className="grid grid-cols-1 gap-5 py-6 md:grid-cols-3">
            {firstDetailSet.map((detail, index) => (
              <LabeledDetail key={index} details={detail} />
            ))}
          </CardSection>
          <CardSection className="grid grid-cols-1 gap-5 py-6 md:grid-cols-2">
            {secondDetailSet.map((detail, index) => (
              <LabeledDetail key={index} details={detail} />
            ))}
          </CardSection>
          <CardSection
            className="justify-start gap-4 md:flex-row"
            noBottomBorder
          >
            <div className="flex flex-col items-stretch">
              <PrimaryButtonLink to={AppLinks.EditLender(lender.id)}>
                Edit Details
              </PrimaryButtonLink>
            </div>
            <Form
              method="post"
              onSubmit={handleDeleteSubmit}
              className="flex flex-col items-stretch"
            >
              <DangerButton type="submit" disabled={isProcessing}>
                Delete Lender
              </DangerButton>
            </Form>
          </CardSection>
        </Card>
      </CenteredView>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
