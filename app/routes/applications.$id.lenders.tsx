import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { json, redirect } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import { useState } from 'react';
import { z } from 'zod';

import {
  ActionContextProvider,
  useForm,
} from '~/components/ActionContextProvider';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { Card } from '~/components/Card';
import { CardHeading } from '~/components/CardHeading';
import { CardSection } from '~/components/CardSection';
import { CenteredView } from '~/components/CenteredView';
import { CustomCheckbox } from '~/components/CustomCheckbox';
import { InlineAlert } from '~/components/InlineAlert';
import { PrimaryButton } from '~/components/PrimaryButton';
import { Toolbar } from '~/components/Toolbar';
import { prisma } from '~/db.server';
import { UserType } from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  getValidatedId,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFieldErrors, hasFormError } from '~/models/forms';
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

  const [application, lenders] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        applicantId: true,
        channels: {
          select: {
            lender: {
              select: {
                id: true,
                user: { select: { id: true, fullName: true } },
              },
            },
            decisions: { select: { id: true } },
          },
        },
      },
    }),
    prisma.lender
      .findMany({
        select: { id: true, user: { select: { fullName: true } } },
      })
      .then((lenders) =>
        lenders.map((lender) => ({
          id: lender.id,
          fullName: lender.user.fullName,
        })),
      ),
  ]);
  if (!application) {
    throw new Response('Application not found', {
      status: StatusCode.NotFound,
    });
  }

  return json({ application, lenders });
}

const Schema = z.object({
  lenders: z.preprocess((arg) => {
    try {
      if (typeof arg === 'string') {
        return JSON.parse(arg);
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }, z.number().int().min(0).array()),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.kind !== UserType.Admin) {
    throw new Response("You're not authorised to view this page", {
      status: StatusCode.Forbidden,
    });
  }

  try {
    const id = getValidatedId(params.id);
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return processBadRequest(result.error, fields);
    }
    const { lenders } = result.data;
    console.log('lenders', lenders);

    const application = await prisma.application.findUnique({
      where: { id },
      select: {
        channels: { select: { lenderId: true } },
      },
    });
    if (!application) {
      throw new Response('Application not found', {
        status: StatusCode.NotFound,
      });
    }

    await prisma.$transaction(async (tx) => {
      const channelsToDelete = application.channels
        .map((c) => c.lenderId)
        .filter((lenderId) => !lenders.includes(lenderId));
      await tx.channel.deleteMany({
        where: { id: { in: channelsToDelete } },
      });

      const lendersToAdd = lenders.filter((lenderId) => {
        return application.channels.every((c) => c.lenderId !== lenderId);
      });
      await tx.channel.createMany({
        data: lendersToAdd.map((lenderId) => ({
          lenderId,
          applicationId: id,
        })),
      });
    });

    return redirect(AppLinks.Application(id));
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function ApplicationsIdLenders() {
  const user = useUser();
  const { application, lenders } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const { getNameProp, isProcessing } = useForm(
    { data: actionData, state: nav.state },
    Schema,
  );

  const [selectedLenders, setSelectedLenders] = useState<number[]>(
    application.channels.map((c) => c.lender.id) || [],
  );

  function toggleLender(id: number) {
    setSelectedLenders((prevState) => {
      const alreadyAdded = prevState.some((lenderId) => lenderId === id);
      if (alreadyAdded) {
        return prevState.filter((lenderId) => lenderId !== id);
      }
      return [...prevState, id];
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-6">
      <Toolbar currentUser={user} />
      <CenteredView>
        <Form method="post">
          <ActionContextProvider {...actionData} isSubmitting={isProcessing}>
            {hasFormError(actionData) && (
              <InlineAlert>{actionData.formError}</InlineAlert>
            )}
            <input
              type="hidden"
              {...getNameProp('lenders')}
              value={JSON.stringify(selectedLenders)}
            />
            <Card>
              <CardHeading className="flex flex-row items-center gap-2 py-2">
                <span>{application.fullName} - Select Lenders To Apply To</span>
                <div className="grow" />
                <PrimaryButton type="submit" disabled={isProcessing}>
                  {isProcessing ? 'Saving...' : 'Save'}
                </PrimaryButton>
              </CardHeading>
              <CardSection className="grid grid-cols-1 gap-4 py-6 md:grid-cols-2 lg:grid-cols-3">
                {lenders.map((lender) => {
                  const selected = selectedLenders.some(
                    (lenderId) => lenderId === lender.id,
                  );
                  return (
                    <CustomCheckbox
                      key={lender.id}
                      name={`Lender_${lender.id}`}
                      checked={selected}
                      onChange={() => toggleLender(lender.id)}
                    >
                      {lender.fullName}
                    </CustomCheckbox>
                  );
                })}
              </CardSection>
              {hasFieldErrors(actionData) &&
                actionData.fieldErrors[getNameProp('lenders').name] && (
                  <CardSection>
                    <InlineAlert>
                      {actionData.fieldErrors[getNameProp('lenders').name]}
                    </InlineAlert>
                  </CardSection>
                )}
            </Card>
          </ActionContextProvider>
        </Form>
      </CenteredView>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
