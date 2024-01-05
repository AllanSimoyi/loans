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
        <div className="flex flex-col items-stretch gap-4">
          <span className="text-stone-600 font-semibold">
            Matching Offers :
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lenders.map((lender) => (
              <LenderGridItem key={lender.id} lender={lender} />
            ))}
          </div>
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
