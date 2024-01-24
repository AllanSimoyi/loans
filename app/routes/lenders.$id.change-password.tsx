import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
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
import { FormTextField } from '~/components/FormTextField';
import { InlineAlert } from '~/components/InlineAlert';
import { PrimaryButton } from '~/components/PrimaryButton';
import { Toolbar } from '~/components/Toolbar';
import { prisma } from '~/db.server';
import { PasswordSchema, UserType } from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  getValidatedId,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFormError } from '~/models/forms';
import { createPasswordHash } from '~/models/hashing.server';
import { AppLinks } from '~/models/links';
import { requireUser } from '~/session.server';
import { useUser } from '~/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.kind !== UserType.Admin) {
    throw new Response("You're not authorised to view this page", {
      status: StatusCode.Forbidden,
    });
  }

  return null;
}

const Schema = z
  .object({
    newPassword: PasswordSchema,
    passwordConfirmation: PasswordSchema,
  })
  .refine((arg) => arg.newPassword === arg.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['newPassword'],
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
    const { newPassword } = result.data;

    const lender = await prisma.lender.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!lender) {
      throw new Response('Lender record not found', {
        status: StatusCode.NotFound,
      });
    }

    await prisma.user.update({
      where: { id: lender.userId },
      data: { hashedPassword: await createPasswordHash(newPassword) },
    });

    return redirect(AppLinks.Lender(id));
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function LendersIdChangePassword() {
  const user = useUser();
  useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const { getNameProp, isProcessing } = useForm(
    { data: actionData, state: nav.state },
    Schema,
  );

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
            {hasFormError(actionData) && (
              <InlineAlert>{actionData.formError}</InlineAlert>
            )}
            <div className="flex flex-col items-stretch gap-4 py-4">
              <Card>
                <CardHeading>Change Password</CardHeading>
                <CardSection className="gap-4 py-4" noBottomBorder>
                  <FormTextField
                    type="password"
                    {...getNameProp('newPassword')}
                    label="New Password"
                    placeholder="Enter new password"
                  />
                  <FormTextField
                    type="password"
                    {...getNameProp('passwordConfirmation')}
                    label="Re-enter Password"
                    placeholder="Re-enter Password"
                  />
                </CardSection>
                <CardSection>
                  <PrimaryButton type="submit" disabled={isProcessing}>
                    {isProcessing ? 'Changing Password...' : 'Change Password'}
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
