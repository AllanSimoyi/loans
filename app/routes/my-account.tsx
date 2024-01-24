import {
  json,
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
import { CardSection } from '~/components/CardSection';
import { CenteredView } from '~/components/CenteredView';
import { FormTextField } from '~/components/FormTextField';
import { GhostButtonLink } from '~/components/GhostButton';
import { InlineAlert } from '~/components/InlineAlert';
import { PrimaryButton } from '~/components/PrimaryButton';
import { Toolbar } from '~/components/Toolbar';
import { prisma } from '~/db.server';
import { EmailAddressSchema, FullNameSchema } from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  getQueryParams,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFields, hasFormError } from '~/models/forms';
import { AppLinks } from '~/models/links';
import {
  createUserSession,
  requireUser,
  requireUserId,
} from '~/session.server';
import { useUser } from '~/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const queryParams = getQueryParams(request.url, ['message']);
  const result = z.string().max(50).optional().safeParse(queryParams.message);
  if (!result.success) {
    throw new Response(
      'Invalid input provided for the message parameter, please try again',
      { status: StatusCode.BadRequest },
    );
  }
  const message = result.data;
  return json({ message });
}

const Schema = z.object({
  fullName: FullNameSchema,
  emailAddress: EmailAddressSchema,
});
export async function action({ request }: ActionFunctionArgs) {
  const currentUser = await requireUser(request);

  try {
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return processBadRequest(result.error, fields);
    }
    const { fullName, emailAddress } = result.data;

    const numDuplicates = await prisma.user.count({
      where: { emailAddress, id: { not: { in: [currentUser.id] } } },
    });
    if (numDuplicates) {
      return badRequest<keyof z.infer<typeof Schema>>({
        fieldErrors: { emailAddress: ['Email address already in use'] },
      });
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { emailAddress, fullName },
    });

    return createUserSession({
      request,
      userId: currentUser.id,
      remember: false,
      redirectTo: `${AppLinks.MyAccount}?message=Details_updated`,
    });
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function MyAccount() {
  const currentUser = useUser();
  const { message } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const { getNameProp, isProcessing } = useForm(
    {
      data: actionData,
      state: nav.state,
    },
    Schema,
  );

  const defaultValues: Record<
    keyof z.infer<typeof Schema>,
    string | undefined
  > = {
    fullName: currentUser.fullName,
    emailAddress: currentUser.emailAddress,
  };

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={currentUser} />
      <CenteredView
        innerProps={{
          className: twMerge('gap-4 py-4 w-full md:w-[60%] lg:w-[40%]'),
        }}
      >
        {!!message && <InlineAlert success>{message}</InlineAlert>}
        <Card>
          <CardSection className="items-center md:flex-row">
            <h2>Update Account Details</h2>
            <div className="grow" />
            <div className="flex flex-row items-center gap-2">
              <GhostButtonLink to={AppLinks.ChangePassword}>
                Change Password
              </GhostButtonLink>
            </div>
          </CardSection>
          <Form method="post">
            <ActionContextProvider
              {...actionData}
              fields={hasFields(actionData) ? actionData.fields : defaultValues}
              isSubmitting={isProcessing}
            >
              {hasFormError(actionData) && (
                <InlineAlert>{actionData.formError}</InlineAlert>
              )}
              <CardSection className="gap-4 py-6">
                <FormTextField
                  {...getNameProp('fullName')}
                  label="Full Name"
                  placeholder="Enter your full name"
                />
                <FormTextField
                  {...getNameProp('emailAddress')}
                  label="Email Address"
                  placeholder="you@example.com"
                />
              </CardSection>
              <CardSection className="items-start" noBottomBorder>
                <PrimaryButton type="submit" disabled={isProcessing}>
                  {!isProcessing ? 'Save Details' : 'Saving...'}
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
