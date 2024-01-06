export const DATE_INPUT_FORMAT = 'YYYY-MM-DD';

export function delay(milliSeconds: number) {
  return new Promise((res) => setTimeout(() => res(undefined), milliSeconds));
}
