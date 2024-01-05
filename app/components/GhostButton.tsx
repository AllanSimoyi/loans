import type { RemixLinkProps } from '@remix-run/react/dist/components';
import type { ComponentProps } from 'react';

import { Link } from '@remix-run/react';
import { twMerge } from 'tailwind-merge';

import { UnderLineOnHover } from './UnderLineOnHover';

interface GetClassNameProps {
  disabled: boolean | undefined;
  className: string | undefined;
}
function getClassName(props: GetClassNameProps) {
  const { disabled, className: inputClassName } = props;

  return twMerge(
    'rounded-lg text-center font-semibold transition-all duration-300 md:bg-transparent py-1 text-indigo-600',
    'focus:outline-stone-100 hover:bg-indigo-50',
    disabled && 'text-stone-200',
    inputClassName,
  );
}

type Props = ComponentProps<'button'>;
export function GhostButton(props: Props) {
  const { disabled, className, type = 'button', ...restOfProps } = props;
  return (
    <button
      type={type}
      className={getClassName({ className, disabled })}
      disabled={disabled}
      {...restOfProps}
    />
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link>, RemixLinkProps {}
export function GhostButtonLink(props: ButtonLinkProps) {
  const { className, children, ...restOfProps } = props;
  return (
    <UnderLineOnHover>
      <Link
        className={getClassName({ className, disabled: false })}
        {...restOfProps}
      >
        {children}
      </Link>
    </UnderLineOnHover>
  );
}
