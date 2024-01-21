import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

export function UnderLineOnHover(props: ComponentProps<'div'>) {
  const { children, className, ...restOfProps } = props;
  return (
    <div
      className={twMerge('group flex flex-col items-stretch gap-0', className)}
      {...restOfProps}
    >
      {children}
      <span className="block h-1 max-w-0 bg-blue-600 transition-all duration-300 group-hover:max-w-full" />
    </div>
  );
}
