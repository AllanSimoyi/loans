import { redirect, type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
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
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFormError } from '~/models/forms';
import { AppLinks } from '~/models/links';
import { requireUser } from '~/session.server';

const Schema = z.object({
  newEntry: z.string().min(1).max(30),
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
    const { newEntry } = result.data;

    await prisma.employmentType.create({
      data: { employmentType: newEntry },
    });
    return redirect(AppLinks.EmploymentTypes);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function EmploymentTypesAdd() {
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const { getNameProp, isProcessing } = useForm(
    { data: actionData, state: nav.state },
    Schema,
  );

  return (
    <Form method="post" className="flex flex-col items-stretch gap-4">
      <ActionContextProvider isSubmitting={isProcessing}>
        {hasFormError(actionData) && (
          <InlineAlert>{actionData.formError}</InlineAlert>
        )}
        <CardSection noBottomBorder>
          <FormTextField
            {...getNameProp('newEntry')}
            label="Employment Type"
            placeholder="Employment Type"
          />
        </CardSection>
        <CardSection className="items-end py-0" noBottomBorder>
          <PrimaryButton type="submit" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Submit'}
          </PrimaryButton>
        </CardSection>
      </ActionContextProvider>
    </Form>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
