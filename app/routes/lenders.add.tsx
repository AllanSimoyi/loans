import { faker } from '@faker-js/faker';
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
import { UploadLogo } from '~/components/UploadLogo';
import { prisma } from '~/db.server';
import {
  EmailAddressSchema,
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
    fullName: z.string().min(1).max(50),
    emailAddress: EmailAddressSchema,
    password: PasswordSchema,
    passwordConfirmation: PasswordSchema,

    logoPublicId: z.string(),
    minTenure: z.coerce.number().int().min(1),
    maxTenure: z.coerce.number().int().min(1),
    minAmount: z.coerce.number().min(1),
    maxAmount: z.coerce.number().min(1),
    monthlyInterest: z.coerce.number().min(0),
    adminFee: z.coerce.number().min(0),
    applicationFee: z.coerce.number().min(0),
  })
  .refine((arg) => arg.password === arg.passwordConfirmation, {
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
    const {
      fullName,
      emailAddress,
      password,
      logoPublicId,
      minTenure,
      maxTenure,
      minAmount,
      maxAmount,
      monthlyInterest,
      adminFee,
      applicationFee,
    } = result.data;

    const numDuplicates = await prisma.user.count({
      where: { emailAddress },
    });
    if (numDuplicates) {
      return badRequest<keyof z.infer<typeof Schema>>({
        fieldErrors: { emailAddress: ['Email address already used'] },
      });
    }

    await prisma.lender.create({
      data: {
        logo: '',
        logoPublicId,
        logoWidth: 0,
        logoHeight: 0,
        minTenure,
        maxTenure,
        minAmount,
        maxAmount,
        monthlyInterest,
        adminFee,
        applicationFee,
        user: {
          create: {
            fullName,
            emailAddress,
            kind: UserType.Lender,
            hashedPassword: await createPasswordHash(password.trim()),
          },
        },
      },
    });

    return redirect(AppLinks.Lenders);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function LendersAdd() {
  const user = useUser();
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

    logoPublicId: '',
    minTenure: faker.number.int({ min: 1, max: 3 }).toString(),
    maxTenure: faker.number.int({ min: 4, max: 12 }).toString(),
    minAmount: faker.number.float({ max: 200, precision: 0.01 }).toString(),
    maxAmount: faker.number.float({ max: 10_000, precision: 0.01 }).toString(),
    monthlyInterest: faker.number
      .float({ min: 1, max: 50, precision: 0.01 })
      .toString(),
    adminFee: faker.number
      .float({ min: 1, max: 20, precision: 0.01 })
      .toString(),
    applicationFee: faker.number
      .float({ min: 1, max: 20, precision: 0.01 })
      .toString(),
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
            fields={defaultValues}
            isSubmitting={isProcessing}
          >
            {hasFormError(actionData) && (
              <InlineAlert>{actionData.formError}</InlineAlert>
            )}
            <div className="flex flex-col items-stretch gap-4 py-4">
              <Card>
                <CardHeading>Add Lender</CardHeading>
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
              </Card>
              <Card>
                <CardHeading>Logo</CardHeading>
                <CardSection className="py-6" noBottomBorder>
                  <UploadLogo
                    initialPublicId={undefined}
                    {...getNameProp('logoPublicId')}
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
                    {isProcessing ? 'Adding Lender...' : 'Add Lender'}
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
