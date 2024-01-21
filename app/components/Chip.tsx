import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

interface Props extends ComponentProps<'div'> {}
export function Chip(props: Props) {
  const { children, className, ...restOfProps } = props;

  return (
    <div
      className={twMerge(
        'flex flex-col items-stretch rounded-md bg-stone-50 p-2',
        className,
      )}
      {...restOfProps}
    >
      {children}
    </div>
  );
}
