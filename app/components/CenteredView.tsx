import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

interface Props extends ComponentProps<'div'> {
  children: React.ReactNode;
  innerProps?: ComponentProps<'div'>;
  className?: string;
}

export function CenteredView(props: Props) {
  const { children, className, ...restOfProps } = props;
  const { className: innerClassName, ...restOfInnerProps } =
    props.innerProps || {};
  return (
    <div
      className={twMerge(
        'flex flex-col items-center justify-center',
        className,
      )}
      {...restOfProps}
    >
      <div
        className={twMerge(
          'flex flex-col items-stretch',
          'w-full md:w-[80%] lg:w-[90%]',
          innerClassName,
        )}
        {...restOfInnerProps}
      >
        {children}
      </div>
    </div>
  );
}
