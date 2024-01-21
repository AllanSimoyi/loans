import type { RemixLinkProps } from '@remix-run/react/dist/components';
import type { ComponentProps } from 'react';

import { Link } from '@remix-run/react';
import { twMerge } from 'tailwind-merge';

interface GetClassNameProps {
  className: string | undefined;
  disabled: boolean | undefined;
}
function getClassName(props: GetClassNameProps) {
  const { className: inputClassName, disabled } = props;
  const className = twMerge(
    'rounded-md transition-all duration-300 text-center p-3 py-2',
    'bg-stone-200 text-stone-600 hover:bg-stone-300 focus:bg-stone-200 focus:outline-green-100',
    disabled &&
      'text-stone-400/40 cursor-not-allowed bg-stone-200/50 hover:bg-stone-200/50',
    inputClassName || '',
  );
  return className;
}

type Props = ComponentProps<'button'>;
export function SecondaryButton(props: Props) {
  const {
    className,
    children,
    type = 'button',
    disabled,
    ...restOfProps
  } = props;
  return (
    <button
      type={type}
      className={getClassName({ className, disabled })}
      disabled={disabled}
      {...restOfProps}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link>, RemixLinkProps {}
export function SecondaryButtonLink(props: ButtonLinkProps) {
  const { children, className, ...restOfProps } = props;
  return (
    <Link
      className={getClassName({ className, disabled: false })}
      {...restOfProps}
    >
      {children}
    </Link>
  );
}

type ExternalLinkProps = ComponentProps<'a'>;
export function SecondaryButtonExternalLink(props: ExternalLinkProps) {
  const { children, className, ...restOfProps } = props;
  return (
    <a
      className={getClassName({ className, disabled: false })}
      {...restOfProps}
    >
      {children}
    </a>
  );
}
