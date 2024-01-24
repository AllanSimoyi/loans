import type { ComponentProps } from 'react';

import { useField } from './ActionContextProvider';

interface Props extends ComponentProps<'input'> {}
export function CustomCheckbox(props: Props) {
  const { name, children, className, ...restOfProps } = props;

  const { error } = useField(name!);

  return (
    <div className="flex flex-col items-start gap-4">
      <label className="cursor-pointer rounded-md p-2 transition-all duration-300 hover:bg-stone-100">
        <input
          type="checkbox"
          name={name}
          className={className}
          {...restOfProps}
        />
        <span className="px-4 font-light text-stone-800">{children}</span>
      </label>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
