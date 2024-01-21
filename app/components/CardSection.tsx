import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

interface Props extends ComponentProps<'div'> {
  noBottomBorder?: boolean;
}

export function CardSection(props: Props) {
  const { children, className, noBottomBorder = false, ...restOfProps } = props;
  return (
    <div
      className={twMerge(
        'flex flex-col items-stretch justify-center p-4',
        !noBottomBorder && 'border-b border-dashed border-stone-200',
        className,
      )}
      {...restOfProps}
    >
      {children}
    </div>
  );
}
