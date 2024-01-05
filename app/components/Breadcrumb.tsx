import { Link } from '@remix-run/react';
import { Fragment } from 'react';
import { ChevronRight } from 'tabler-icons-react';

import { capitalize } from '~/models/strings';

import { UnderLineOnHover } from './UnderLineOnHover';

interface Props {
  items: ({ link: string; label: string } | string)[];
}
export function Breadcrumb(props: Props) {
  const { items } = props;

  return (
    <h2 className="flex flex-wrap items-stretch gap-2 text-xl font-semibold">
      {items.map((item, index) => (
        <Fragment key={index}>
          {typeof item === 'string' ? (
            <span className="text-stone-800">{capitalize(item)}</span>
          ) : null}
          {typeof item !== 'string' ? (
            <Link to={item.link}>
              <UnderLineOnHover>
                <span className="text-stone-400 transition-all duration-150 hover:text-stone-600">
                  {capitalize(item.label)}
                </span>
              </UnderLineOnHover>
            </Link>
          ) : null}
          {index < items.length - 1 ? (
            <div className="flex flex-col items-center justify-center">
              <ChevronRight className="text-stone-400" />
            </div>
          ) : null}
        </Fragment>
      ))}
    </h2>
  );
}
