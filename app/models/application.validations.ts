import { z } from 'zod';

import {
  CreateAccountSchema,
  EmailAddressSchema,
  PasswordSchema,
} from '~/models/auth.validations';

import { DateSchema, PositiveIntSchema } from './core.validations';

export enum KycDoc {
  NationalID = 'National-ID/Passport',
  ProofOfResidence = 'Proof Of Residence',
  PaySlip = 'Pay Slip',
}
export const KYC_DOCS = [
  KycDoc.NationalID,
  KycDoc.ProofOfResidence,
  KycDoc.PaySlip,
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

export const PriorLoanSchema = z.object({
  lender: z.string().min(1).max(100),
  expiryDate: DateSchema,
  amount: PositiveIntSchema,
  monthlyRepayment: PositiveIntSchema,
  balance: PositiveIntSchema,
});
export const KycDocSchema = z.object({
  label: z.string().min(1).max(100),
  publicId: z.string().min(1).max(500),
});
export const KycDocsSchema = z.array(KycDocSchema);

export const CreateApplicationSchema = z.object({
  'signup.emailAddress': EmailAddressSchema.optional(),
  'signup.password': PasswordSchema.optional(),
  'signup.passwordConfirmation': PasswordSchema.optional(),

  selectedLenderId: PositiveIntSchema,
  moreDetail: z.string().max(800),

  bank: z.string().min(1).max(100),
  bankBranch: z.string().min(1).max(200),
  accNumber: z.string().min(1).max(20),
  accName: z.string().min(1).max(200),

  loanPurpose: z.string().min(1).max(300),
  amtRequired: PositiveIntSchema,
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
  grossIncome: PositiveIntSchema,
  netIncome: PositiveIntSchema,

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
    if (typeof arg === 'string') {
      return JSON.parse(arg);
    }
  }, KycDocsSchema),
  'priorLoan.lender': z.string().min(1).max(100).optional(),
  'priorLoan.expiryDate': DateSchema.optional(),
  'priorLoan.amount': PositiveIntSchema.optional(),
  'priorLoan.monthlyRepayment': PositiveIntSchema.optional(),
  'priorLoan.balance': PositiveIntSchema.optional(),
});

export const EditApplicationSchema = CreateApplicationSchema.extend({
  applicationId: PositiveIntSchema,
});

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
  amtRequired: PositiveIntSchema,
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
  grossIncome: PositiveIntSchema,
  netIncome: PositiveIntSchema,

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
