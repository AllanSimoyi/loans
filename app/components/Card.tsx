import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

type CardProps = ComponentProps<'div'>;

export function Card(props: CardProps) {
  const { children, className, ...restOfProps } = props;

  return (
    <div
      className={twMerge(
        'flex flex-col items-stretch rounded-md border border-stone-100 shadow-xl',
        className,
      )}
      {...restOfProps}
    >
      {children}
    </div>
  );
}
