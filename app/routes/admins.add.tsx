import { faker } from '@faker-js/faker';
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  redirect,
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
import {
  EmailAddressSchema,
  FullNameSchema,
  PasswordSchema,
  UserType,
} from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFormError } from '~/models/forms';
import { AppLinks } from '~/models/links';
import { createAdminUser } from '~/models/user.server';
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
    fullName: FullNameSchema,
    emailAddress: EmailAddressSchema,
    password: PasswordSchema,
    passwordConfirmation: PasswordSchema,
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'],
  });
export async function action({ request }: ActionFunctionArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.kind !== UserType.Admin) {
    throw new Response("You're not authorised to view this page", {
      status: StatusCode.Forbidden,
    });
  }

  try {
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return processBadRequest(result.error, fields);
    }
    const input = result.data;
    await createAdminUser(input);
    return redirect(AppLinks.Admins);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function AdminsAdd() {
  const currentUser = useUser();
  useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const { getNameProp, isProcessing } = useForm(
    { data: actionData, state: nav.state },
    Schema,
  );

  const defaultValues: Record<
    keyof z.infer<typeof Schema>,
    string | undefined
  > = {
    fullName: faker.person.fullName(),
    emailAddress: faker.internet.email(),
    password: '',
    passwordConfirmation: '',
  };

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={currentUser} />
      <CenteredView
        innerProps={{
          className: twMerge('gap-4 px-4 py-8 md:w-[80%] lg:w-[60%]'),
        }}
      >
        <Form method="post">
          <ActionContextProvider
            {...actionData}
            fields={actionData?.fields || defaultValues}
            isSubmitting={isProcessing}
          >
            {hasFormError(actionData) && (
              <InlineAlert>{actionData.formError}</InlineAlert>
            )}
            <Card className="flex flex-col items-stretch">
              <CardHeading className="items-start">Add Admin</CardHeading>
              <CardSection className="gap-4 py-4">
                <FormTextField
                  {...getNameProp('fullName')}
                  label="Full Name"
                  placeholder="John Makute"
                />
                <FormTextField
                  {...getNameProp('emailAddress')}
                  label="Email Address"
                  placeholder="you@example.com"
                />
                <FormTextField
                  {...getNameProp('password')}
                  label="Password"
                  placeholder="Password"
                  type="password"
                />
                <FormTextField
                  {...getNameProp('passwordConfirmation')}
                  label="Re-enter Password"
                  placeholder="Re-enter Password"
                  type="password"
                />
              </CardSection>
              <CardSection noBottomBorder className="items-start">
                <PrimaryButton type="submit" disabled={isProcessing}>
                  {isProcessing ? 'Adding Admin...' : 'Add Admin'}
                </PrimaryButton>
              </CardSection>
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
