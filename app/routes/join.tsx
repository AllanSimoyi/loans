import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';

import { redirect } from '@remix-run/node';
import { Form, Link, useActionData, useNavigation } from '@remix-run/react';

import {
  ActionContextProvider,
  useForm,
} from '~/components/ActionContextProvider';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { FormTextField } from '~/components/FormTextField';
import { GhostButtonLink } from '~/components/GhostButton';
import { InlineAlert } from '~/components/InlineAlert';
import { Logo } from '~/components/Logo';
import { PrimaryButton } from '~/components/PrimaryButton';
import { CreateAccountSchema, UserType } from '~/models/auth.validations';
import { badRequest, processBadRequest } from '~/models/core.validations';
import { getRawFormFields } from '~/models/forms';
import { AppLinks } from '~/models/links';
import { createUser, getUserByEmail } from '~/models/user.server';
import { createUserSession, getUser } from '~/session.server';

export const meta: MetaFunction = () => [
  { title: 'Quick Loans - Create Account' },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const currentUser = await getUser(request);
  if (currentUser) {
    if (
      currentUser.kind === UserType.Admin ||
      currentUser.kind === UserType.Lender
    ) {
      return redirect(AppLinks.Applications);
    }
    return redirect('/');
  }
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const fields = await getRawFormFields(request);
  const result = CreateAccountSchema.safeParse(fields);
  if (!result.success) {
    return processBadRequest(result.error, fields);
  }
  const { emailAddress, password, fullName } = result.data;

  const existingUser = await getUserByEmail(emailAddress);
  if (existingUser) {
    return badRequest({
      fields,
      fieldErrors: {
        emailAddress: ['A user already exists with this email address'],
      },
      formError: undefined,
    });
  }

  const user = await createUser({
    emailAddress,
    password,
    fullName,
    kind: UserType.Applicant,
  });
  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo: AppLinks.Home,
  });
};

export default function Join() {
  const actionData = useActionData<typeof action>();

  const navigation = useNavigation();
  const isProcessing = navigation.formAction === AppLinks.CreateAccount;
  const { getNameProp } = useForm(
    { data: actionData, state: navigation.state },
    CreateAccountSchema,
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <Form
        method="post"
        className="flex w-[100%] flex-col items-stretch gap-4 sm:w-[80%] md:w-[60%] lg:w-[30%]"
      >
        <ActionContextProvider {...actionData} isSubmitting={isProcessing}>
          <div className="flex flex-col items-center justify-center p-4">
            <Link
              to={AppLinks.Home}
              className="flex w-2/5 flex-col items-center justify-center"
            >
              <Logo />
            </Link>
          </div>
          <div className="flex flex-col items-stretch gap-4 pb-4">
            <div className="flex flex-col items-center justify-center">
              <span className="text-xl font-normal text-stone-600">
                Create An Account
              </span>
            </div>
            <FormTextField
              {...getNameProp('fullName')}
              label="Full Name"
              placeholder="Enter Your Name"
            />
            <FormTextField
              {...getNameProp('emailAddress')}
              type="email"
              label="Email"
              placeholder="you@gmail.com"
            />
            <FormTextField
              {...getNameProp('password')}
              type="password"
              label="Password"
            />
            <FormTextField
              {...getNameProp('passwordConfirmation')}
              type="password"
              label="Re-enter Password"
            />
            {actionData?.formError ? (
              <InlineAlert>{actionData.formError}</InlineAlert>
            ) : null}
            <div className="flex flex-col items-stretch gap-4 py-4">
              <PrimaryButton type="submit" disabled={isProcessing}>
                {isProcessing ? 'Creating Account...' : 'Create Account'}
              </PrimaryButton>
              <GhostButtonLink to={AppLinks.Login}>
                {'Already Have An Account'}
              </GhostButtonLink>
            </div>
          </div>
        </ActionContextProvider>
      </Form>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
