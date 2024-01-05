import type { ComponentProps } from 'react';

interface Props extends ComponentProps<'button'> {
  large?: boolean;
}
export function DangerButton(props: Props) {
  const { large, type = 'button', disabled, className, ...restOfProps } = props;

  return (
    <button
      type={type}
      className={`rounded text-center font-semibold text-white transition-all duration-300 ${
        large ? 'py-6 text-[1.2em] uppercase xl:p-8 ' : 'p-4 text-base '
      } ${
        disabled
          ? 'cursor-not-allowed bg-red-500/50 '
          : 'bg-red-500 hover:bg-red-600 focus:bg-red-400 focus:outline-red-400 '
      } ${className || ''}`}
      {...restOfProps}
    />
  );
}
