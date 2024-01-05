import { z } from 'zod';

import { PositiveIntSchema } from './core.validations';

export const FullNameSchema = z
  .string()
  .min(3, 'Please ensure the full name is at least 3 characters long')
  .max(49, 'Please ensure the full name is less than 50 characters long');

export const EmailAddressSchema = z
  .string()
  .email()
  .min(4)
  .transform((str) => str.toLowerCase().trim());

export const PasswordSchema = z
  .string()
  .min(4)
  .max(100)
  .transform((str) => str.trim());

export const CreateAccountSchema = z
  .object({
    fullName: FullNameSchema,
    emailAddress: EmailAddressSchema,
    password: PasswordSchema,
    passwordConfirmation: PasswordSchema,
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'], // set the path of the error
  });

export const CreateAdminSchema = z
  .object({
    fullName: FullNameSchema,
    emailAddress: EmailAddressSchema,
    password: PasswordSchema,
    passwordConfirmation: PasswordSchema,
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'], // set the path of the error
  });

export const EditAccountSchema = z.object({
  fullName: FullNameSchema,
  emailAddress: EmailAddressSchema,
});

export const EditAdminAccountSchema = EditAccountSchema.extend({
  userId: PositiveIntSchema,
});

export const ForgotPasswordSchema = z.object({
  emailAddress: EmailAddressSchema,
});

export const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    passwordConfirmation: PasswordSchema,
    token: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ['passwordConfirmation'], // set the path of the error
  });

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
});

export function parseRedirectUrl(url: string) {
  const DEFAULT_REDIRECT = '/';
  if (!url || typeof url !== 'string') {
    return DEFAULT_REDIRECT;
  }
  if (!url.startsWith('/') || url.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }
  const redirectableUrls = [
    '/',
    '/employment-types',
    '/applications',
    '/lenders',
    '/apply',
  ];
  if (redirectableUrls.includes(url)) {
    return url;
  }
  return DEFAULT_REDIRECT;
}

export interface CurrentUser {
  id: number;
  fullName: string;
  emailAddress: string;
  kind: string;
}

export const ADMIN = 'Admin';
export const LENDER = 'Lender';
export const APPLICANT = 'Applicant';
