import type { ComponentProps } from 'react';

import { AlertTriangle } from 'tabler-icons-react';
import { twMerge } from 'tailwind-merge';

interface Props extends ComponentProps<'div'> {
  children: React.ReactNode | string | string[];
  success?: boolean;
}

export function InlineAlert(props: Props) {
  const { children, success, className, ...restOfProps } = props;
  return (
    <div
      className={twMerge(
        'flex flex-row items-center justify-start space-x-4 rounded-md p-3 shadow-lg',
        'border-l-2 border-l-red-600 bg-red-50',
        success && 'border-l-green-600 bg-green-50',
        className,
      )}
      {...restOfProps}
    >
      {typeof children === 'string' ? (
        <div className="flex flex-row items-center gap-2">
          <AlertTriangle
            className={twMerge('text-red-500', success && 'text-green-500')}
          />
          <span
            className={twMerge(
              'font-light text-red-500',
              success && 'text-stone-800',
            )}
          >
            {children.split('_').join(' ')}
          </span>
        </div>
      ) : null}
      {children instanceof Array ? (
        <div className="flex flex-col items-start gap-2">
          {children.map((child, index) => (
            <span
              key={index}
              className={twMerge(
                'font-light text-red-500',
                success && 'text-green-500',
              )}
            >
              {child || "Please ensure you've provided valid input"}
            </span>
          ))}
        </div>
      ) : null}
      {typeof children !== 'string' && !(children instanceof Array)
        ? children
        : null}
    </div>
  );
}
