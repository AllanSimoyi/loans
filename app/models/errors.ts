import { z } from 'zod';

export function getErrorMessage(error: unknown) {
  const Schema = z.object({ message: z.string() });
  const result = Schema.safeParse(error);
  if (!result.success) {
    return 'Something went wrong, please try again';
  }
  return result.data.message;
}
