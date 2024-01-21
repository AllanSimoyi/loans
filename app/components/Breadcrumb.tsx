import { Fragment } from 'react';
import { ChevronRight } from 'tabler-icons-react';

import { capitalize } from '~/models/strings';

import { GhostButtonLink } from './GhostButton';

interface Props {
  items: ({ link: string; label: string } | string)[];
}
export function Breadcrumb(props: Props) {
  const { items } = props;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xl font-semibold">
      {items.map((item, index) => (
        <Fragment key={index}>
          {typeof item === 'string' && (
            <div className="flex flex-col items-stretch">
              <span className="py-1 text-stone-800">{capitalize(item)}</span>
              <span className="block h-1 max-w-0 bg-white" />
            </div>
          )}
          {typeof item !== 'string' && (
            <GhostButtonLink to={item.link}>
              {capitalize(item.label)}
            </GhostButtonLink>
          )}
          {index < items.length - 1 && (
            <div className="flex flex-col items-center justify-center">
              <ChevronRight className="text-stone-400" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
