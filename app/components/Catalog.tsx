import type { LenderGridItemProps } from './LenderGridItem';

import { LenderGridItem } from './LenderGridItem';

interface Props {
  lenders: LenderGridItemProps['lender'][];
}

export function Catalog(props: Props) {
  const { lenders } = props;
  return (
    <>
      {!!lenders.length && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lenders.map((lender) => (
            <LenderGridItem key={lender.id} lender={lender} />
          ))}
        </div>
      )}
      {!lenders.length && (
        <div className="flex flex-col justify-center items-center">
          <span className="text-white">No matching lenders found</span>
        </div>
      )}
    </>
  );
}
