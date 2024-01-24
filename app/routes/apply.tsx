import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import type { KycDocSchema } from '~/models/application.validations';

import { faker } from '@faker-js/faker';
import {
  Form,
  json,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import {
  ActionContextProvider,
  useForm,
} from '~/components/ActionContextProvider';
import { BankDetails } from '~/components/BankDetails';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { CenteredView } from '~/components/CenteredView';
import { Credentials } from '~/components/Credentials';
import { InlineAlert } from '~/components/InlineAlert';
import { LoanDetails } from '~/components/LoanDetails';
import { NextOfKinDetails } from '~/components/NextOfKinDetails';
import { PersonalDetails } from '~/components/PersonalDetails';
import { PrimaryButton } from '~/components/PrimaryButton';
import { PriorLoanDetails } from '~/components/PriorLoanDetails';
import { Toolbar } from '~/components/Toolbar';
import { UploadDocuments } from '~/components/UploadDocuments';
import { WorkDetails } from '~/components/WorkDetails';
import { prisma } from '~/db.server';
import { useUploadKycDoc } from '~/hooks/useUploadKycDoc';
import { createApplication } from '~/models/application.server';
import {
  CreateApplicationSchema,
  KycDoc,
  MARITAL_STATUSES,
  NATURE_OF_RES_OPTIONS,
  TransformedCreateApplicationSchema,
} from '~/models/application.validations';
import { UserType } from '~/models/auth.validations';
import {
  StatusCode,
  badRequest,
  getQueryParams,
  processBadRequest,
} from '~/models/core.validations';
import { DATE_INPUT_FORMAT } from '~/models/dates';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields } from '~/models/forms';
import { AppLinks } from '~/models/links';
import { createApplicant } from '~/models/user.server';
import { createUserSession, getUser } from '~/session.server';
import { useOptionalUser } from '~/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUser = await getUser(request);
  if (currentUser && currentUser.kind !== UserType.Applicant) {
    throw new Response(
      `${currentUser?.kind.toLowerCase()} users can't apply for loans`,
      { status: StatusCode.Unauthorised },
    );
  }

  const queryParams = getQueryParams(request.url, ['selectedLenderId']);
  const result = z.coerce
    .number()
    .optional()
    .safeParse(queryParams.selectedLenderId);
  if (!result.success) {
    throw new Response(
      'Received an invalid lender ID, please reselect a lender',
      { status: StatusCode.BadRequest },
    );
  }
  const selectedLenderId = result.data;

  const lenders = await prisma.lender
    .findMany({
      select: { id: true, user: { select: { fullName: true } } },
      where: { deactivated: false },
    })
    .then((lenders) =>
      lenders.map(({ user, ...lender }) => ({
        ...lender,
        lenderName: user.fullName,
      })),
    );
  const selectedLender = lenders.find(
    (lender) => lender.id === selectedLenderId,
  );
  if (selectedLenderId && !selectedLender) {
    throw new Response('Lender record not found, please reselect a lender', {
      status: StatusCode.NotFound,
    });
  }

  return json({ lenders, selectedLender });
}

export async function action({ request }: ActionFunctionArgs) {
  const currentUser = await getUser(request);

  try {
    const fields = await getRawFormFields(request);
    const result = TransformedCreateApplicationSchema.safeParse(fields);
    if (!result.success) {
      console.log('failed to parse input to create new application');
      return processBadRequest(result.error, fields);
    }
    const input = result.data;

    const missing = [KycDoc.NationalID, KycDoc.ProofOfResidence, KycDoc.PaySlip]
      .map((label) => ({
        label,
        doc: input.kycDocs.find((kycDoc) => kycDoc.label === label),
      }))
      .filter(({ doc }) => !doc);

    if (missing.length) {
      return badRequest({
        fieldErrors: {
          kycDocs: [`Missing: ${missing.map((doc) => doc.label).join(', ')}`],
        },
      });
    }

    if (currentUser) {
      await createApplication({ ...input, applicantId: currentUser.id });
      return redirect(AppLinks.Applications);
    }

    if (!input.signUpDetails) {
      return badRequest({
        fieldErrors: {
          emailAddress: ['Please provide your email and password'],
        },
      });
    }

    const { id: applicantId } = await createApplicant({
      fullName: input.fullName,
      emailAddress: input.signUpDetails.emailAddress || '',
      password: input.signUpDetails.password || '',
      passwordConfirmation: input.signUpDetails.passwordConfirmation || '',
    });

    await createApplication({ ...input, applicantId });

    return createUserSession({
      request,
      userId: applicantId,
      remember: true,
      redirectTo: AppLinks.Applications,
    });
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function Apply() {
  const user = useOptionalUser();
  const { lenders, selectedLender } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const nav = useNavigation();
  const isProcessing = nav.formMethod === 'post';

  const fetcherObj = { data: actionData, state: nav.state };
  const { getNameProp } = useForm(fetcherObj, CreateApplicationSchema);

  // const nationalIdKyc = useUploadKycDoc({ initialPublicId: '' });
  // const proofOfResidenceKyc = useUploadKycDoc({ initialPublicId: '' });
  // const paySlipKyc = useUploadKycDoc({ initialPublicId: '' });
  const nationalIdKyc = useUploadKycDoc({
    initialPublicId: 'h2bkwgii1e28hltu7f99',
  });
  const proofOfResidenceKyc = useUploadKycDoc({
    initialPublicId: 'h2bkwgii1e28hltu7f99',
  });
  const paySlipKyc = useUploadKycDoc({
    initialPublicId: 'h2bkwgii1e28hltu7f99',
  });
  const letterFromEmployerKyc = useUploadKycDoc({ initialPublicId: '' });
  const bankStatementKyc = useUploadKycDoc({ initialPublicId: '' });

  const kycDocs: z.infer<typeof KycDocSchema>[] = [
    { publicId: nationalIdKyc.publicId, label: KycDoc.NationalID },
    { publicId: proofOfResidenceKyc.publicId, label: KycDoc.ProofOfResidence },
    { publicId: paySlipKyc.publicId, label: KycDoc.PaySlip },
    {
      publicId: letterFromEmployerKyc.publicId,
      label: KycDoc.LetterFromEmployer,
    },
    { publicId: bankStatementKyc.publicId, label: KycDoc.BankStatement },
  ];

  const defaultValues: Record<
    keyof z.infer<typeof CreateApplicationSchema>,
    string | undefined
  > = {
    emailAddress: faker.internet.email(),
    password: '',
    passwordConfirmation: '',

    selectedLenderId: selectedLender?.id.toString() || '0',
    moreDetail: faker.lorem.paragraph(2),

    bank: faker.company.name(),
    bankBranch: faker.location.streetAddress(),
    accNumber: faker.finance.accountNumber(),
    accName: faker.finance.accountName(),

    loanPurpose: faker.word.noun(20),
    amtRequired: faker.finance.amount({ min: 100, max: 100_000 }),
    repaymentPeriod: faker.number.int({ min: 3, max: 12 }).toString(),

    title: faker.person.prefix(),
    fullName: faker.person.fullName(),
    DOB: dayjs(faker.date.birthdate({ min: 18, max: 70, mode: 'age' })).format(
      DATE_INPUT_FORMAT,
    ),
    nationalID: faker.helpers.fromRegExp('[0-9]{2}-[0-9]{6}-[A-Z][0-9]{2}'),
    phoneNumber: faker.helpers.fromRegExp('+26377#{7}'),
    resAddress: faker.location.streetAddress(),
    natureOfRes: NATURE_OF_RES_OPTIONS[0],

    fullMaidenNames: '',
    fullNameOfSpouse: faker.person.fullName(),
    maritalStatus: MARITAL_STATUSES[0],

    profession: faker.person.jobTitle(),
    employer: faker.company.name(),
    employedSince: dayjs(faker.date.recent()).format(DATE_INPUT_FORMAT),
    grossIncome: faker.finance.amount({ min: 4_000, max: 10_000 }),
    netIncome: faker.finance.amount({ max: 4_000 }),

    firstNokFullName: faker.person.fullName(),
    firstNokRelationship: 'Relative',
    firstNokEmployer: faker.company.name(),
    firstNokResAddress: faker.location.streetAddress(),
    firstNokPhoneNumber: faker.helpers.fromRegExp('+26377#{7}'),

    secondNokFullName: faker.person.fullName(),
    secondNokRelationship: 'Relative',
    secondNokEmployer: faker.company.name(),
    secondNokResAddress: faker.location.streetAddress(),
    secondNokPhoneNumber: faker.helpers.fromRegExp('+26377#{7}'),

    kycDocs: JSON.stringify([
      {
        label: KycDoc.NationalID,
        publicId: 'h2bkwgii1e28hltu7f99',
      },
      {
        label: KycDoc.PaySlip,
        publicId: 'h2bkwgii1e28hltu7f99',
      },
      {
        label: KycDoc.LetterFromEmployer,
        publicId: 'h2bkwgii1e28hltu7f99',
      },
    ]),
    priorLoanLender: faker.company.name(),
    priorLoanExpiryDate: faker.date.recent().toString(),
    priorLoanAmount: faker.finance.amount({ min: 1_000 }),
    priorLoanMonthlyRepayment: faker.finance.amount({ max: 500 }),
    priorLoanBalance: faker.finance.amount({ min: 500, max: 1_000 }),
  };

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={user} />
      <CenteredView innerProps={{ className: twMerge('lg:w-[50%]') }}>
        <div className="flex flex-col items-stretch gap-4 px-4 py-8">
          {actionData?.formError && (
            <InlineAlert>{actionData.formError}</InlineAlert>
          )}
          <div className="flex flex-col items-center justify-center p-4">
            <span className="text-base font-light">
              Apply For Loan
              <span className="font-normal">
                {selectedLender ? ` From ${selectedLender?.lenderName}` : ''}
              </span>
            </span>
          </div>
          <Form method="post" className="flex flex-col items-stretch gap-4">
            <ActionContextProvider
              {...actionData}
              fields={actionData?.fields || defaultValues}
              isSubmitting={isProcessing}
            >
              <PersonalDetails actionData={fetcherObj} />
              <LoanDetails actionData={fetcherObj} lenders={lenders} />
              <BankDetails actionData={fetcherObj} />
              <WorkDetails actionData={fetcherObj} />
              <input
                type="hidden"
                {...getNameProp('kycDocs')}
                value={JSON.stringify(kycDocs.filter((doc) => doc.publicId))}
              />
              <UploadDocuments
                nationalIdKyc={nationalIdKyc}
                proofOfResidenceKyc={proofOfResidenceKyc}
                paySlipKyc={paySlipKyc}
                letterFromEmployerKyc={letterFromEmployerKyc}
                bankStatementKyc={bankStatementKyc}
              />
              <NextOfKinDetails actionData={fetcherObj} />
              <PriorLoanDetails actionData={fetcherObj} isOpen={false} />
              {!user && <Credentials actionData={fetcherObj} />}
              <div className="flex flex-col items-center justify-center">
                <PrimaryButton type="submit" disabled={isProcessing}>
                  {isProcessing ? 'Sending...' : 'Submit Application'}
                </PrimaryButton>
              </div>
            </ActionContextProvider>
          </Form>
        </div>
      </CenteredView>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
