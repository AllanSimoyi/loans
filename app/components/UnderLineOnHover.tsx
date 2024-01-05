import type { ComponentProps } from 'react';

export function UnderLineOnHover(props: ComponentProps<'div'>) {
  const { children, ...restOfProps } = props;
  return (
    <div className="group flex flex-col items-stretch gap-0" {...restOfProps}>
      {children}
      <span className="block h-1 max-w-0 bg-indigo-600 transition-all duration-300 group-hover:max-w-full" />
    </div>
  );
}
