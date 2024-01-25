import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { json, redirect } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import { z } from 'zod';

import {
  ActionContextProvider,
  useForm,
} from '~/components/ActionContextProvider';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { CardSection } from '~/components/CardSection';
import { FormTextField } from '~/components/FormTextField';
import { InlineAlert } from '~/components/InlineAlert';
import { PrimaryButton } from '~/components/PrimaryButton';
import { prisma } from '~/db.server';
import { UserType } from '~/models/auth.validations';
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

export async function loader({ request, params }: LoaderFunctionArgs) {
  const id = getValidatedId(params.id);
  const employmentType = await prisma.employmentType.findUnique({
    where: { id },
  });
  if (!employmentType) {
    throw new Response('Employment type not found', {
      status: StatusCode.NotFound,
    });
  }
  return json({ employmentType });
}

const Schema = z.object({
  newValue: z.string().min(1).max(30),
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
    const { newValue } = result.data;

    await prisma.employmentType.update({
      where: { id },
      data: { employmentType: newValue },
    });
    return redirect(AppLinks.EmploymentTypes);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function EmploymentTypesIdEdit() {
  const { employmentType } = useLoaderData<typeof loader>();
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
    newValue: employmentType.employmentType,
  };

  return (
    <Form
      method="post"
      key={employmentType.id}
      className="flex flex-col items-stretch gap-4"
    >
      <ActionContextProvider
        fields={actionData?.fields || defaultValues}
        isSubmitting={isProcessing}
      >
        {hasFormError(actionData) && (
          <InlineAlert>{actionData.formError}</InlineAlert>
        )}
        <CardSection noBottomBorder>
          <FormTextField
            {...getNameProp('newValue')}
            label="Employment Type"
            placeholder="Employment Type"
          />
        </CardSection>
        <CardSection className="items-end py-0" noBottomBorder>
          <PrimaryButton type="submit" disabled={isProcessing}>
            {!isProcessing ? 'Submit' : 'Updating...'}
          </PrimaryButton>
        </CardSection>
      </ActionContextProvider>
    </Form>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
