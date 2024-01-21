import type { ActionData, FieldErrors, FormFieldKey } from './forms';

import { json } from '@remix-run/node';
import { z } from 'zod';

export enum ResponseMessage {
  Unauthorised = "You're not authorised to access this resource",
  InvalidId = 'Invalid ID provided',
  RecordNotFound = 'Record not found',
  DeletedRecord = 'Record was deleted',
  InvalidMethod = 'Invalid request method provided',
}

export enum StatusCode {
  BadRequest = 400,
  Unauthorised = 401,
  Forbidden = 403,
  NotFound = 404,
}

export const CleanPositiveIntSchema = z.number().positive();
export const StringNumber = z.coerce.number({
  invalid_type_error: 'Provide a valid number',
  required_error: 'Provide a number',
});
export const PositiveDecimalSchema = z.coerce.number().positive();
// export const PositiveDecimalSchema = z
// .number()
// .positive()
// .or(StringNumber)
// .refine((n) => n > 0);
export const PerhapsZeroIntSchema = z.coerce.number().int().min(0);
// export const PerhapsZeroIntSchema = z
//   .number()
//   .int()
//   .min(0)
//   .or(StringNumber)
//   .refine((n) => n > 0);
export const PositiveIntSchema = z.coerce.number().int().min(1);
// export const PositiveIntSchema = z
// .number()
// .int()
// .min(1)
// .or(StringNumber)
// .refine((n) => n > 0);

export const DateSchema = z.coerce.date();
// export const DateSchema = z.preprocess((arg) => {
//   if (typeof arg == "string" || arg instanceof Date) {
//     return new Date(arg);
//   }
// }, z.date());

export type inferSafeParseErrors<T extends z.ZodTypeAny> = {
  [P in keyof z.infer<T>]?: string[];
};

export function badRequest<F extends FormFieldKey = string>(
  data: ActionData<F>,
) {
  return json(data, { status: StatusCode.BadRequest });
}

export const INVALID_VALUES_FROM_SERVER =
  'Received invalid values from server, please contact out support team';

export function containsNumbers(str: string) {
  return Boolean(str.match(/\d/));
}

export const PresentStringSchema = z
  .string({
    invalid_type_error: 'Provide a valid string',
    required_error: 'Provide a string',
  })
  .min(1, { message: 'Use at least 1 character for the string' });

export function ComposeRecordIdSchema(
  identifier: string,
  optional?: 'optional',
) {
  const Schema = z.coerce.number({
    invalid_type_error: `Enter a valid ${identifier}`,
    required_error: `Enter a ${identifier}`,
  });
  if (optional) {
    return Schema;
  }
  return Schema.min(1, { message: `Enter a valid ${identifier}` });
}
export const RecordIdSchema = ComposeRecordIdSchema('record ID');

export function hasSuccess(data: unknown): data is { success: boolean } {
  return z.object({ success: z.literal(true) }).safeParse(data).success;
}

export function getValidatedId(rawId: unknown) {
  const result = RecordIdSchema.safeParse(rawId);
  if (!result.success) {
    throw new Response(ResponseMessage.InvalidId, {
      status: StatusCode.BadRequest,
    });
  }
  return result.data;
}

export function processBadRequest(
  zodError: z.ZodError<unknown>,
  fields: ActionData['fields'],
  dontLog?: 'dontLog',
) {
  const { formErrors, fieldErrors } = zodError.flatten();
  if (!dontLog) {
    console.log('fields', fields);
    console.log('fieldErrors', fieldErrors);
    console.log('formErrors', formErrors);
  }
  return badRequest({
    fields,
    fieldErrors,
    formError: formErrors.join(', '),
  });
}

export function getQueryParams<T extends string>(url: string, params: T[]) {
  const urlObj = new URL(url);
  return params.reduce(
    (acc, param) => ({
      ...acc,
      [param]: urlObj.searchParams.get(param) || undefined,
    }),
    {} as Record<T, string | undefined>,
  );
}

export const TitleSchema = z
  .string({
    required_error: 'Please enter the title',
    invalid_type_error: 'Please provide valid input for the title',
  })
  .min(1, 'Please enter the title first')
  .max(100, 'Please use less than 200 characters for the title');

const WithErrMsgSchema = z.object({
  errorMessage: z.string(),
});
export function hasErrorMessage(
  data: unknown,
): data is z.infer<typeof WithErrMsgSchema> {
  return WithErrMsgSchema.safeParse(data).success;
}

export function fieldErrorsToArr(fieldErrors: FieldErrors) {
  return Object.keys(fieldErrors)
    .map((key) => {
      const errors = fieldErrors[key];
      if (!errors) {
        return undefined;
      }
      return errors.join(', ');
    })
    .filter(Boolean);
}

export const _METHOD = '_method';
export const _METHOD_DELETE = '_method_delete';

export const FormLiteral = {
  ActionType: '_action_type',
  Comment: '_comment',
  TogglePostLike: '_toggle_post_like',
  ToggleCommentLike: '_toggle_comment_like',
};

export const FormActionSchema = z.object({
  _action_type: z.enum([
    FormLiteral.Comment,
    FormLiteral.TogglePostLike,
    FormLiteral.ToggleCommentLike,
  ]),
});

export function getIsOnlyDeleteMethod(formData: FormData) {
  return formData.get(_METHOD) === _METHOD_DELETE;
}

export function formatAmount(amount: number, fractionDigits?: number) {
  const refinedAmount = Number(amount.toFixed(1));
  return refinedAmount.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits !== undefined ? fractionDigits : 2,
    maximumFractionDigits: fractionDigits !== undefined ? fractionDigits : 2,
  });
}
