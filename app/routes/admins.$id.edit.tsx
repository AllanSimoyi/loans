import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { json, redirect } from '@remix-run/node';
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
import { GhostButtonLink } from '~/components/GhostButton';
import { InlineAlert } from '~/components/InlineAlert';
import { PrimaryButton } from '~/components/PrimaryButton';
import { Toolbar } from '~/components/Toolbar';
import { prisma } from '~/db.server';
import {
  EmailAddressSchema,
  FullNameSchema,
  UserType,
} from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  getValidatedId,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFormError } from '~/models/forms';
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
  const admin = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true, emailAddress: true },
  });
  if (!admin) {
    throw new Response('Admin record not found', {
      status: StatusCode.NotFound,
    });
  }

  return json({ admin });
}

const Schema = z.object({
  fullName: FullNameSchema,
  emailAddress: EmailAddressSchema,
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
    const { fullName, emailAddress } = result.data;

    const numDuplicates = await prisma.user.count({
      where: { emailAddress },
    });
    if (numDuplicates) {
      return badRequest<keyof z.infer<typeof Schema>>({
        fields,
        fieldErrors: { emailAddress: ['Email address already used'] },
      });
    }

    await prisma.user.update({
      where: { id },
      data: { emailAddress, fullName },
    });

    return redirect(AppLinks.Admins);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function AdminsIdEdit() {
  const currentUser = useUser();
  const { admin } = useLoaderData<typeof loader>();
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
    fullName: admin.fullName,
    emailAddress: admin.emailAddress,
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
              <CardHeading className="flex flex-row items-center gap-2">
                <h2>Edit Admin</h2>
                <div className="grow" />
                <div className="flex flex-row items-center gap-2">
                  <GhostButtonLink to={AppLinks.ChangeAdminPassword(admin.id)}>
                    Change Password
                  </GhostButtonLink>
                </div>
              </CardHeading>
              <input type="hidden" name="userId" value={admin?.id || 0} />
              {hasFormError(actionData) && (
                <InlineAlert>{actionData.formError}</InlineAlert>
              )}
              <CardSection className="gap-4">
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
              </CardSection>
              <CardSection className="items-start" noBottomBorder>
                <PrimaryButton type="submit" disabled={isProcessing}>
                  {!isProcessing ? 'Update Admin' : 'Updating...'}
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
