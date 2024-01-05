type FieldErrors = Record<string, string[] | undefined>;
export function flattenFieldErrors(fieldErrors: FieldErrors) {
  return Object.keys(fieldErrors)
    .map((key) => ({
      key,
      errors: fieldErrors[key],
    }))
    .filter((el) => el)
    .map((el) => `${el.key}: ${el.errors?.join(', ')}`)
    .join(', ');
}
