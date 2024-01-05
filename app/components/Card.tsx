import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

type CardProps = ComponentProps<'div'>;

export function Card(props: CardProps) {
  const { children, className, ...restOfProps } = props;

  return (
    <div
      className={twMerge(
        'flex flex-col items-stretch shadow-md border border-stone-200',
        className,
      )}
      {...restOfProps}
    >
      {children}
    </div>
  );
}
