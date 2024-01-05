import type { ComponentProps } from 'react';

import { useEffect, useState } from 'react';

export default function useDebounce(
  callback: (newValue: string) => void,
  delay: number,
  defaultValue?: ComponentProps<'input'>['defaultValue'],
) {
  const [newValue, setNewValue] = useState(defaultValue?.toString() || '');
  const [oldValue, setOldValue] = useState(defaultValue?.toString() || '');

  useEffect(() => {
    if (newValue !== oldValue) {
      const timeout = setTimeout(() => {
        callback(newValue);
        setOldValue(newValue);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [newValue, oldValue, callback, delay]);

  return { newValue, setNewValue };
}
