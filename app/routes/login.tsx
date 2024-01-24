import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';

import { json, redirect } from '@remix-run/node';
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { EmailAddressSchema, UserType } from '~/models/auth.validations';
import {
  badRequest,
  getQueryParams,
  processBadRequest,
} from '~/models/core.validations';
import { getRawFormFields } from '~/models/forms';
import { AppLinks } from '~/models/links';
import { verifyLogin } from '~/models/user.server';
import { createUserSession, getUser } from '~/session.server';

export const meta: MetaFunction = () => [{ title: 'Quick Loans - Login' }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const currentUser = await getUser(request);
  if (currentUser) {
    if (
      currentUser.kind === UserType.Admin ||
      currentUser.kind === UserType.Lender
    ) {
      return redirect(AppLinks.Applications);
    }
    return redirect(AppLinks.Home);
  }
  const { message } = getQueryParams(request.url, ['message']);
  return json({ message });
};

const Schema = z.object({
  emailAddress: EmailAddressSchema,
  password: z.string().min(1),
});
export const action = async ({ request }: ActionFunctionArgs) => {
  const fields = await getRawFormFields(request);
  const result = Schema.safeParse(fields);
  if (!result.success) {
    return processBadRequest(result.error, fields);
  }
  const { emailAddress, password } = result.data;

  const user = await verifyLogin(emailAddress, password);
  if (!user) {
    return badRequest({ fields, formError: `Incorrect credentials` });
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: true,
    redirectTo: AppLinks.Home,
  });
};

export default function LoginPage() {
  const { message } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const navigation = useNavigation();
  const isProcessing = navigation.formAction === AppLinks.Login;
  const { getNameProp } = useForm(
    { data: actionData, state: navigation.state },
    Schema,
  );

  useEffect(() => {
    if (message) {
      toast.info(message);
    }
  }, [message]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-2">
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
              <span className="text-xl font-semibold text-stone-600">
                Log In To Continue
              </span>
            </div>
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
            {actionData?.formError ? (
              <InlineAlert>{actionData.formError}</InlineAlert>
            ) : null}
            <div className="flex flex-col items-stretch gap-4 py-4">
              <PrimaryButton type="submit" disabled={isProcessing}>
                {isProcessing ? 'Logging In...' : 'Log In'}
              </PrimaryButton>
              <GhostButtonLink to={AppLinks.CreateAccount}>
                {"Don't Have An Account"}
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
