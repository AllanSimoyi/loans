import type { ActionData, FormFieldKey } from '~/models/forms';

import { useMemo } from 'react';

import { fieldErrorsToArr, hasFieldErrors, hasFormError } from '~/models/forms';

export default function useActionErrors<K extends FormFieldKey>(
  actionData: ActionData<K> | undefined,
) {
  return useMemo(() => {
    if (!actionData) {
      return undefined;
    }
    const fieldErrors = hasFieldErrors(actionData)
      ? fieldErrorsToArr(actionData.fieldErrors).join(', ')
      : undefined;
    const formError = hasFormError(actionData)
      ? actionData.formError
      : undefined;
    return [formError, fieldErrors].filter(Boolean).join(', ');
  }, [actionData]);
}
