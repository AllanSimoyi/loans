import type { FieldErrors, FormFields } from '../models/forms';
import type { Fetcher } from '@remix-run/react';
import type { ZodTypeAny, z } from 'zod';

import { createContext, useCallback, useContext, useMemo } from 'react';

import { hasFieldErrors, hasFields, hasFormError } from '~/models/forms';

interface ContextProps {
  formError?: string;
  fields?: FormFields;
  fieldErrors?: FieldErrors;
  isSubmitting?: boolean;
}

export const ActionContext = createContext<ContextProps>({
  formError: undefined,
  fields: {},
  fieldErrors: {},
  isSubmitting: false,
});

interface Props extends ContextProps {
  children: React.ReactNode;
}
export function ActionContextProvider(props: Props) {
  const { children, ...restOfProps } = props;
  return (
    <ActionContext.Provider value={restOfProps}>
      {children}
    </ActionContext.Provider>
  );
}

function useActionContext() {
  const context = useContext<ContextProps>(ActionContext);
  if (!context) {
    throw new Error(
      `useActionContext must be used within a ActionContextProvider`,
    );
  }
  return context;
}

export function useField(name: string) {
  const { fields, fieldErrors } = useActionContext();
  return {
    value: fields?.[name],
    error: fieldErrors?.[name],
  };
}

export function useFormError() {
  const { formError } = useActionContext();
  return formError;
}

export function useIsSubmitting() {
  const { isSubmitting } = useActionContext();
  return isSubmitting;
}

export function useForm<T extends ZodTypeAny>(
  fetcher: { data?: Fetcher['data']; state: Fetcher['state'] } | undefined,
  Schema: T,
) {
  type SchemaKeys = keyof z.infer<typeof Schema>;

  const getNameProp = useCallback((name: SchemaKeys) => {
    return { name };
  }, []);

  const fieldErrors = useMemo(() => {
    if (fetcher && hasFieldErrors(fetcher.data)) {
      return fetcher.data.fieldErrors as FieldErrors<SchemaKeys>;
    }
  }, [fetcher]);

  const formError = useMemo(() => {
    if (fetcher && hasFormError(fetcher.data)) {
      return fetcher.data.formError;
    }
  }, [fetcher]);

  const fields = useMemo(() => {
    if (fetcher && hasFields(fetcher.data)) {
      return fetcher.data.fields as FormFields<SchemaKeys>;
    }
  }, [fetcher]);

  return {
    getNameProp,
    fieldErrors,
    formError,
    fields,
    isProcessing: fetcher?.state !== 'idle',
  };
}
