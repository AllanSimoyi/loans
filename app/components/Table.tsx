import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

export function Th(props: ComponentProps<'th'>) {
  const { className, ...restOfProps } = props;
  return (
    <th
      className={twMerge(
        'border border-stone-200 p-2 text-left font-normal',
        className,
      )}
      {...restOfProps}
    />
  );
}

export function Td(props: ComponentProps<'td'>) {
  const { className, ...restOfProps } = props;
  return (
    <td
      className={twMerge(
        'border border-stone-200 p-2 text-left font-light',
        className,
      )}
      {...restOfProps}
    />
  );
}
