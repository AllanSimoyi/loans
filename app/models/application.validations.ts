import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import {
  CreateAccountSchema,
  EmailAddressSchema,
  PasswordSchema,
} from '~/models/auth.validations';

import {
  DateSchema,
  PositiveDecimalSchema,
  PositiveIntSchema,
} from './core.validations';

export enum KycDoc {
  NationalID = 'National-ID/Passport',
  ProofOfResidence = 'Proof Of Residence',
  PaySlip = 'Pay Slip',
  LetterFromEmployer = 'Letter From Employer',
  BankStatement = 'Bank Statement',
}
export const KYC_DOCS = [
  KycDoc.NationalID,
  KycDoc.ProofOfResidence,
  KycDoc.PaySlip,
  KycDoc.LetterFromEmployer,
  KycDoc.BankStatement,
] as const;

export enum MaritalStatus {
  Single = 'Single',
  Married = 'Married',
}
export const MARITAL_STATUSES = [
  MaritalStatus.Single,
  MaritalStatus.Married,
] as const;

export enum NatureOfRes {
  Owned = 'Owned',
  Rented = 'Rented',
  Mortgaged = 'Mortgaged',
  ProvidedByEmployer = 'Provided By Employer',
  StayingWithParents = 'Staying With Parents',
}
export const NATURE_OF_RES_OPTIONS = [
  NatureOfRes.Owned,
  NatureOfRes.Rented,
  NatureOfRes.Mortgaged,
  NatureOfRes.ProvidedByEmployer,
  NatureOfRes.StayingWithParents,
] as const;

export enum ApplicationState {
  Pending = 'Pending',
  Approved = 'Approved',
  Declined = 'Declined',
}
export const APPLICATION_STATES = [
  ApplicationState.Pending,
  ApplicationState.Approved,
  ApplicationState.Declined,
] as const;

export const KycDocSchema = z.object({
  label: z.string().min(1).max(100),
  publicId: z.string().min(1).max(500),
});
export const KycDocsSchema = z.array(KycDocSchema);

export const PriorLoanSchema = z.object({
  lender: z.string().min(1).max(100),
  expiryDate: DateSchema,
  amount: PositiveDecimalSchema,
  monthlyRepayment: PositiveDecimalSchema,
  balance: PositiveDecimalSchema,
});

export const CreateApplicationSchema = z.object({
  emailAddress: EmailAddressSchema.optional(),
  password: PasswordSchema.optional(),
  passwordConfirmation: PasswordSchema.optional(),

  selectedLenderId: PositiveIntSchema,
  moreDetail: z.string().max(800),

  bank: z.string().min(1).max(100),
  bankBranch: z.string().min(1).max(200),
  accNumber: z.string().min(1).max(20),
  accName: z.string().min(1).max(200),

  loanPurpose: z.string().min(1).max(300),
  amtRequired: PositiveDecimalSchema,
  repaymentPeriod: PositiveIntSchema,

  title: z.string().min(1).max(10),
  fullName: z.string().min(1).max(100),
  DOB: DateSchema,
  nationalID: z.string().min(1).max(20),
  phoneNumber: z.string().min(1).max(20),
  resAddress: z.string().min(1).max(300),
  natureOfRes: z.string().min(1).max(50),

  fullMaidenNames: z.string().max(100),
  fullNameOfSpouse: z.string().max(100),
  maritalStatus: z.string().min(1).max(20),

  profession: z.string().min(1).max(100),
  employer: z.string().min(1).max(100),
  employedSince: DateSchema,
  grossIncome: PositiveDecimalSchema,
  netIncome: PositiveDecimalSchema,

  firstNokFullName: z.string().min(1).max(100),
  firstNokRelationship: z.string().min(1).max(100),
  firstNokEmployer: z.string().min(1).max(100),
  firstNokResAddress: z.string().min(1).max(200),
  firstNokPhoneNumber: z.string().min(1).max(20),

  secondNokFullName: z.string().min(1).max(100),
  secondNokRelationship: z.string().min(1).max(100),
  secondNokEmployer: z.string().min(1).max(100),
  secondNokResAddress: z.string().min(1).max(200),
  secondNokPhoneNumber: z.string().min(1).max(20),

  kycDocs: z.preprocess((arg) => {
    try {
      if (typeof arg === 'string') {
        return JSON.parse(arg);
      }
    } catch (error) {
      return undefined;
    }
  }, KycDocsSchema),
  priorLoanLender: z.string().min(1).max(100).or(z.literal('')).optional(),
  priorLoanExpiryDate: DateSchema.or(z.literal('')).optional(),
  priorLoanAmount: PositiveDecimalSchema.or(z.literal('')).optional(),
  priorLoanMonthlyRepayment: PositiveDecimalSchema.or(z.literal('')).optional(),
  priorLoanBalance: PositiveDecimalSchema.or(z.literal('')).optional(),
});
export const EditApplicationSchema = CreateApplicationSchema.extend({
  applicationId: PositiveIntSchema,
});

export const UserDetailsSchema = z
  .object({
    emailAddress: EmailAddressSchema,
    password: PasswordSchema,
    passwordConfirmation: PasswordSchema,
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'],
  });

export const TransformedCreateApplicationSchema =
  CreateApplicationSchema.transform((data, ctx) => {
    const {
      emailAddress,
      password,
      passwordConfirmation,
      priorLoanLender,
      priorLoanExpiryDate,
      priorLoanAmount,
      priorLoanMonthlyRepayment,
      priorLoanBalance,
      ...restOfData
    } = data;
    const signUpDetails = (() => {
      if (!emailAddress) {
        return undefined;
      }
      const result = UserDetailsSchema.safeParse(data);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error.issues
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join(', '),
          path: ['emailAddress'],
        });
        return undefined;
      }
      return result.data;
    })();
    const priorLoan = (() => {
      if (!data.priorLoanLender) {
        return undefined;
      }
      const result = PriorLoanSchema.safeParse({
        lender: priorLoanLender,
        expiryDate: priorLoanExpiryDate,
        amount: priorLoanAmount,
        monthlyRepayment: priorLoanMonthlyRepayment,
        balance: priorLoanBalance,
      });
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error.issues
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join(', '),
          path: ['priorLoanLender'],
        });
        return undefined;
      }
      return result.data;
    })();

    return { ...restOfData, signUpDetails, priorLoan };
  });
export const TransformedEditApplicationSchema = EditApplicationSchema.transform(
  (data, ctx) => {
    const {
      emailAddress,
      password,
      passwordConfirmation,
      priorLoanLender,
      priorLoanExpiryDate,
      priorLoanAmount,
      priorLoanMonthlyRepayment,
      priorLoanBalance,
      ...restOfData
    } = data;
    const signUpDetails = (() => {
      if (!emailAddress) {
        return undefined;
      }
      const result = UserDetailsSchema.safeParse(data);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error.issues
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join(', '),
          path: ['emailAddress'],
        });
        return undefined;
      }
      return result.data;
    })();
    const priorLoan = (() => {
      if (!data.priorLoanLender) {
        return undefined;
      }
      const result = PriorLoanSchema.safeParse({
        lender: priorLoanLender,
        expiryDate: priorLoanExpiryDate,
        amount: priorLoanAmount,
        monthlyRepayment: priorLoanMonthlyRepayment,
        balance: priorLoanBalance,
      });
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error.issues
            .map((issue) => `${issue.path}: ${issue.message}`)
            .join(', '),
          path: ['priorLoanLender'],
        });
        return undefined;
      }
      return result.data;
    })();

    return { ...restOfData, signUpDetails, priorLoan };
  },
);

export const ApplicationFormSchema = z.object({
  applicationId: PositiveIntSchema.optional(),
  signup: CreateAccountSchema.or(
    z
      .string()
      .transform(transformByJSONParse<z.infer<typeof CreateAccountSchema>>),
  ).optional(),
  selectedLenderId: PositiveIntSchema,
  moreDetail: z.string().max(800),

  bank: z.string().min(1).max(100),
  bankBranch: z.string().min(1).max(200),
  accNumber: z.string().min(1).max(20),
  accName: z.string().min(1).max(200),

  loanPurpose: z.string().min(1).max(300),
  amtRequired: PositiveDecimalSchema,
  repaymentPeriod: PositiveIntSchema,

  title: z.string().min(1).max(10),
  fullName: z.string().min(1).max(100),
  DOB: DateSchema,
  nationalID: z.string().min(1).max(20),
  phoneNumber: z.string().min(1).max(20),
  resAddress: z.string().min(1).max(300),
  natureOfRes: z.string().min(1).max(50),

  fullMaidenNames: z.string().max(100),
  fullNameOfSpouse: z.string().max(100),
  maritalStatus: z.string().min(1).max(20),

  profession: z.string().min(1).max(100),
  employer: z.string().min(1).max(100),
  employedSince: DateSchema,
  grossIncome: PositiveDecimalSchema,
  netIncome: PositiveDecimalSchema,

  firstNokFullName: z.string().min(1).max(100),
  firstNokRelationship: z.string().min(1).max(100),
  firstNokEmployer: z.string().min(1).max(100),
  firstNokResAddress: z.string().min(1).max(200),
  firstNokPhoneNumber: z.string().min(1).max(20),

  secondNokFullName: z.string().min(1).max(100),
  secondNokRelationship: z.string().min(1).max(100),
  secondNokEmployer: z.string().min(1).max(100),
  secondNokResAddress: z.string().min(1).max(200),
  secondNokPhoneNumber: z.string().min(1).max(20),

  kycDocs: KycDocsSchema.or(
    z.string().transform(transformByJSONParse<z.infer<typeof KycDocsSchema>>),
  ),

  priorLoan: PriorLoanSchema
    // .or(z.string().transform(transformByJSONParse<z.infer<typeof PriorLoanSchema>>))
    .optional(),
});
export type Apply = z.infer<typeof ApplicationFormSchema>;

function transformByJSONParse<ResultDataType>(input: string) {
  return JSON.parse(input) as ResultDataType;
}

export function getApplicationDecision(
  decisions: { decision: string; createdAt: Date }[],
) {
  if (!decisions.length) {
    return ApplicationState.Pending;
  }
  const sortedDecisions = decisions.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  return sortedDecisions[0].decision;
}

export function getDecisionColor(decision: string) {
  return twMerge(
    decision === ApplicationState.Pending && 'text-stone-600/60',
    decision === ApplicationState.Approved && 'text-green-600',
    decision === ApplicationState.Declined && 'text-red-600',
  );
}
