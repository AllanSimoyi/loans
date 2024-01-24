import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from '@remix-run/node';
import {
  Form,
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
import { PasswordSchema } from '~/models/auth.validations';
import { badRequest, processBadRequest } from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFormError } from '~/models/forms';
import {
  checkIfPasswordValid,
  createPasswordHash,
} from '~/models/hashing.server';
import { AppLinks } from '~/models/links';
import { requireUserId } from '~/session.server';
import { useUser } from '~/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return null;
}

const Schema = z
  .object({
    oldPassword: z.string(),
    newPassword: PasswordSchema,
    passwordConfirmation: PasswordSchema,
  })
  .refine((data) => data.newPassword === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'],
  });
export async function action({ request }: ActionFunctionArgs) {
  const currentUserId = await requireUserId(request);

  try {
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      console.log('failed to parse input to change password');
      return processBadRequest(result.error, fields, 'dontLog');
    }
    const { oldPassword, newPassword } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { hashedPassword: true },
    });
    if (!user) {
      return badRequest({ formError: 'User record not found' });
    }
    const isValid = await checkIfPasswordValid(
      oldPassword,
      user.hashedPassword,
    );
    if (!isValid) {
      return badRequest({ formError: 'Invalid current password' });
    }

    await prisma.user.update({
      where: { id: currentUserId },
      data: { hashedPassword: await createPasswordHash(newPassword) },
    });

    return redirect(`${AppLinks.MyAccount}?message=Password_changed`);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function ChangePassword() {
  const currentUser = useUser();
  useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const { getNameProp, isProcessing } = useForm(
    { data: actionData, state: nav.state },
    Schema,
  );

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={currentUser} />
      <CenteredView
        innerProps={{
          className: twMerge('gap-4 py-4 w-full md:w-[60%] lg:w-[40%]'),
        }}
      >
        {hasFormError(actionData) && (
          <InlineAlert>{actionData.formError}</InlineAlert>
        )}
        <Card>
          <Form method="post" className="flex flex-col items-stretch">
            <ActionContextProvider {...actionData} isSubmitting={isProcessing}>
              <CardHeading className="items-start">Change Password</CardHeading>
              <CardSection className="gap-4">
                <FormTextField
                  type="password"
                  {...getNameProp('oldPassword')}
                  label="Current Password"
                  placeholder="Enter your current password"
                />
                <FormTextField
                  type="password"
                  {...getNameProp('newPassword')}
                  label="New Password"
                  placeholder="Enter your new password"
                />
                <FormTextField
                  type="password"
                  {...getNameProp('passwordConfirmation')}
                  label="Re-enter Password"
                  placeholder="Re-enter your new password"
                />
              </CardSection>
              <CardSection className="items-start" noBottomBorder>
                <PrimaryButton type="submit" disabled={isProcessing}>
                  {isProcessing ? 'Changing Password...' : 'Change Password'}
                </PrimaryButton>
              </CardSection>
            </ActionContextProvider>
          </Form>
        </Card>
      </CenteredView>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
