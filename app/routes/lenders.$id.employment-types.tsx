import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { json } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
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
  hasSuccess,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFormError } from '~/models/forms';
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
  const [lender, employmentTypes] = await Promise.all([
    prisma.lender.findUnique({
      where: { id },
      select: {
        id: true,
        user: { select: { fullName: true } },
        employmentPreferences: {
          select: {
            employmentType: { select: { id: true, employmentType: true } },
          },
        },
      },
    }),
    prisma.employmentType.findMany({
      select: { id: true, employmentType: true },
    }),
  ]);
  if (!lender) {
    throw new Response('Lender record not found', {
      status: StatusCode.NotFound,
    });
  }

  return json({ lender, employmentTypes });
}

const Schema = z.object({
  employmentTypes: z.preprocess((arg) => {
    if (typeof arg === 'string') {
      try {
        return JSON.parse(arg);
      } catch (error) {
        return undefined;
      }
    }
  }, z.coerce.number().int().positive().array()),
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
    const { employmentTypes } = result.data;

    await prisma.$transaction(async (tx) => {
      await tx.employmentPreference.deleteMany({
        where: { lenderId: id },
      });
      await tx.employmentPreference.createMany({
        data: employmentTypes.map((typeId) => ({
          lenderId: id,
          employmentTypeId: typeId,
        })),
      });
    });

    return json({ success: true });
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function LendersIdEmploymentTypes() {
  const user = useUser();
  const { lender, employmentTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const { getNameProp, isProcessing } = useForm(
    { data: actionData, state: nav.state },
    Schema,
  );

  const [selectedTypes, setSelectedTypes] = useState<number[]>(
    lender.employmentPreferences.map((pref) => {
      return pref.employmentType.id;
    }) || [],
  );

  function toggleType(id: number) {
    return setSelectedTypes((prevState) => {
      const isSelected = prevState.some((e) => e === id);
      if (isSelected) {
        return prevState.filter((e) => e !== id);
      }
      return [...prevState, id];
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-6">
      <Toolbar currentUser={user} />
      <CenteredView
        innerProps={{
          className: twMerge('gap-4 py-4 px-4 w-full md:w-[80%] lg:w-[60%]'),
        }}
      >
        <Form method="post">
          <ActionContextProvider {...actionData} isSubmitting={isProcessing}>
            <input
              type="hidden"
              {...getNameProp('employmentTypes')}
              value={JSON.stringify(selectedTypes)}
            />
            {hasSuccess(actionData) && (
              <InlineAlert success>Updated preferences!</InlineAlert>
            )}
            {hasFormError(actionData) && (
              <InlineAlert>{actionData.formError}</InlineAlert>
            )}
            <div className="flex flex-col items-stretch gap-4 py-4">
              <Card>
                <CardHeading>
                  {lender!.user.fullName || ''} - Employment Type Preferences
                </CardHeading>
                <CardSection className="gap-4 py-4" noBottomBorder>
                  {employmentTypes.map((el) => {
                    const selected = selectedTypes.some((e) => e === el.id);
                    return (
                      <CustomCheckbox
                        key={el.id}
                        name={el.id.toString()}
                        checked={selected}
                        onChange={() => toggleType(el.id)}
                      >
                        {el.employmentType}
                      </CustomCheckbox>
                    );
                  })}
                </CardSection>
                <CardSection>
                  <PrimaryButton type="submit" disabled={isProcessing}>
                    {isProcessing ? 'Updating...' : 'Update Preferences'}
                  </PrimaryButton>
                </CardSection>
              </Card>
            </div>
          </ActionContextProvider>
        </Form>
      </CenteredView>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
