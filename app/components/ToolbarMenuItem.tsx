import type { ComponentProps } from 'react';

import { Link } from '@remix-run/react';
import { twMerge } from 'tailwind-merge';

type Props =
  | ({ mode: 'link' } & ComponentProps<typeof Link> & { active: boolean })
  | ({ mode: 'button' } & ComponentProps<'button'> & { active: boolean });

export function ToolbarMenuItem(props: Props) {
  const { children, className: inputClassName, active, ...restOfProps } = props;

  const className = twMerge(
    'group text-base font-light flex w-full items-center rounded p-2 text-blue-600 transition-all duration-300',
    active && 'bg-stone-200',
    inputClassName,
  );

  if (restOfProps.mode === 'button') {
    return (
      <button className={className} {...restOfProps}>
        {children}
      </button>
    );
  }

  return (
    <Link className={className} {...restOfProps}>
      {children}
    </Link>
  );
}
