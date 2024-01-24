import {
  json,
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
import { UploadLogo } from '~/components/UploadLogo';
import { prisma } from '~/db.server';
import { EmailAddressSchema, UserType } from '~/models/auth.validations';
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
  const lender = await prisma.lender.findUnique({
    where: { id },
    include: {
      user: true,
      employmentPreferences: { include: { employmentType: true } },
    },
  });
  if (!lender) {
    throw new Response('Lender record not found', {
      status: StatusCode.NotFound,
    });
  }

  return json({ lender });
}

const Schema = z.object({
  fullName: z.string().min(1).max(50),
  emailAddress: EmailAddressSchema,

  logoPublicId: z.string(),
  minTenure: z.coerce.number().int().min(1),
  maxTenure: z.coerce.number().int().min(1),
  minAmount: z.coerce.number().min(1),
  maxAmount: z.coerce.number().min(1),
  monthlyInterest: z.coerce.number().min(0),
  adminFee: z.coerce.number().min(0),
  applicationFee: z.coerce.number().min(0),
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
    const input = result.data;

    const lender = await prisma.lender.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!lender) {
      throw new Response('Lender record not found', {
        status: StatusCode.NotFound,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.lender.update({
        where: { id },
        data: {
          logo: '',
          logoPublicId: input.logoPublicId,
          minTenure: input.minTenure,
          maxTenure: input.maxTenure,
          minAmount: input.minAmount,
          maxAmount: input.maxAmount,
          monthlyInterest: input.monthlyInterest,
          adminFee: input.adminFee,
          applicationFee: input.applicationFee,
        },
      });
      await tx.user.update({
        where: { id: lender.userId },
        data: {
          emailAddress: input.emailAddress,
          fullName: input.fullName,
        },
      });
    });

    return redirect(AppLinks.Lender(id));
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function LendersIdEdit() {
  const user = useUser();
  const { lender } = useLoaderData<typeof loader>();
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
    fullName: lender.user.fullName,
    emailAddress: lender.user.emailAddress,

    logoPublicId: lender.logoPublicId?.toString() || '',
    minTenure: lender.minTenure.toString(),
    maxTenure: lender.maxTenure.toString(),
    minAmount: lender.minAmount.toString(),
    maxAmount: lender.maxAmount.toString(),
    monthlyInterest: lender.monthlyInterest.toString(),
    adminFee: lender.adminFee.toString(),
    applicationFee: lender.applicationFee.toString(),
  };

  return (
    <div className="flex flex-col items-stretch gap-4">
      <Toolbar currentUser={user} />
      <CenteredView
        innerProps={{
          className: twMerge('gap-4 py-4 w-full md:w-[60%] lg:w-[40%]'),
        }}
      >
        <Form method="post">
          <ActionContextProvider
            {...actionData}
            fields={actionData?.fields || defaultValues}
            isSubmitting={isProcessing}
          >
            <input type="hidden" name="lender.id" value={lender?.id || 0} />
            {hasFormError(actionData) && (
              <InlineAlert>{actionData.formError}</InlineAlert>
            )}
            <div className="flex flex-col items-stretch gap-4 py-4">
              <Card>
                <CardHeading>Edit Lender</CardHeading>
                <CardSection className="gap-4 py-6" noBottomBorder>
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
              </Card>
              <Card>
                <CardHeading>Logo</CardHeading>
                <CardSection className="py-6" noBottomBorder>
                  <UploadLogo
                    initialPublicId={lender?.logoPublicId}
                    name="logoPublicId"
                  />
                </CardSection>
              </Card>
              <Card>
                <CardSection className="gap-4 py-6">
                  <FormTextField
                    {...getNameProp('minTenure')}
                    type="number"
                    min={0}
                    step={1}
                    label="Min Tenure"
                    placeholder="Min Tenure"
                  />
                  <FormTextField
                    {...getNameProp('maxTenure')}
                    type="number"
                    min={0}
                    step={1}
                    label="Max Tenure"
                    placeholder="Max Tenure"
                  />
                  <FormTextField
                    {...getNameProp('minAmount')}
                    type="number"
                    min={0}
                    step={0.01}
                    label="Min Amount"
                    placeholder="Min Amount"
                  />
                  <FormTextField
                    {...getNameProp('maxAmount')}
                    type="number"
                    min={0}
                    step={0.01}
                    label="Max Amount"
                    placeholder="Max Amount"
                  />
                  <FormTextField
                    {...getNameProp('monthlyInterest')}
                    type="number"
                    min={0}
                    step={0.01}
                    label="Monthly Interest"
                    placeholder="Monthly Interest"
                  />
                  <FormTextField
                    {...getNameProp('adminFee')}
                    type="number"
                    min={0}
                    step={0.01}
                    label="Admin Fee"
                    placeholder="Admin Fee"
                  />
                  <FormTextField
                    {...getNameProp('applicationFee')}
                    type="number"
                    min={0}
                    step={0.01}
                    label="Application Fee"
                    placeholder="Application Fee"
                  />
                </CardSection>
                <CardSection noBottomBorder>
                  <PrimaryButton type="submit" disabled={isProcessing}>
                    {isProcessing ? 'Updating Lender...' : 'Update Lender'}
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
