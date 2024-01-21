import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

interface Props extends ComponentProps<'div'> {
  children: string | React.ReactNode;
}
export function CardHeading(props: Props) {
  const { children, className, ...restOfProps } = props;
  return (
    <div
      className={twMerge(
        'flex flex-col items-center justify-center border-b border-dashed border-stone-400/50 p-4',
        className,
      )}
      {...restOfProps}
    >
      {typeof children === 'string' ? (
        <span className="text-lg">{children}</span>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
