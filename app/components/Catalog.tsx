import type { LenderGridItemProps } from './LenderGridItem';
import type { UserType } from '~/models/auth.validations';

import { LenderGridItem } from './LenderGridItem';

interface Props {
  lenders: LenderGridItemProps['lender'][];
  userType: UserType | undefined;
}

export function Catalog(props: Props) {
  const { lenders, userType } = props;
  return (
    <>
      {!!lenders.length && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lenders.map((lender) => (
            <LenderGridItem
              key={lender.id}
              userType={userType}
              lender={lender}
            />
          ))}
        </div>
      )}
      {!lenders.length && (
        <div className="flex flex-col items-center justify-center">
          <span className="text-white">No matching lenders found</span>
        </div>
      )}
    </>
  );
}
