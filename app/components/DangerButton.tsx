import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

interface Props extends ComponentProps<'button'> {
  large?: boolean;
}
export function DangerButton(props: Props) {
  const { large, type = 'button', disabled, className, ...restOfProps } = props;

  return (
    <button
      type={type}
      className={twMerge(
        'rounded-md p-3 py-2 text-center font-normal text-white shadow-lg transition-all duration-300',
        'bg-red-600 hover:bg-red-700 focus:bg-red-600 focus:outline-red-600',
        disabled && 'cursor-not-allowed bg-red-600/50 hover:bg-red-600/50',
        className,
      )}
      {...restOfProps}
    />
  );
}
