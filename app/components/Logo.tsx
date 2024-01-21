import type { ComponentProps } from 'react';

import { twMerge } from 'tailwind-merge';

import logo from '~/../public/images/logo.png';
import smallLogo from '~/../public/images/small-logo.png';

interface Props extends ComponentProps<'img'> {
  small?: boolean;
}
export function Logo(props: Props) {
  const { small, src, className, ...restOfProps } = props;
  return (
    <img
      src={small ? smallLogo : logo}
      alt="Quick Loans"
      className={twMerge('object-contain', className)}
      {...restOfProps}
    />
  );
}
