import { AppLinks } from '~/models/links';
import { capitalize } from '~/models/strings';

import { Card } from './Card';
import { PrimaryButtonLink } from './PrimaryButton';

type LenderProps = {
  id: number;
  name: string;
  logo: string;
  minTenure: number;
  maxTenure: number;
  employmentPreferences: string[];
  monthlyInterest: number;
  adminFee: number;
  applicationFee: number;
};

export interface LenderGridItemProps {
  lender: LenderProps;
}

export function LenderGridItem(props: LenderGridItemProps) {
  const { lender } = props;
  return (
    <Card className="h-full bg-white rounded-lg">
      <div className="flex flex-row items-center gap-2 p-4 border-b border-dashed border-stone-200">
        <div className="flex flex-col justify-center items-center">
          {lender.logo ? (
            <img className="rounded-full" alt={lender.name} src={lender.logo} />
          ) : (
            <div className="bg-stone-200/60 rounded-full p-2 w-12 h-12 flex flex-col justify-center items-center">
              <span>{capitalize(lender.name.charAt(0))}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-0">
          <span className="font-normal">{lender.name}</span>
          {Boolean(lender.maxTenure) && (
            <span className="font-light text-sm">
              Loans must be repaid in <b>{lender.minTenure}</b> to{' '}
              <b>{lender.maxTenure} months</b>
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-stretchv grow p-4">
        {!!lender.employmentPreferences.length && (
          <span className="text-sm font-light px-4">
            Giving loans to{' '}
            {lender.employmentPreferences.map((pref) => (
              <span className="font-semibold mr-2" key={pref}>
                {pref}
              </span>
            ))}
            {/* Giving loans to {lender.employmentPreferences.join(', ')} */}
          </span>
        )}
        <div className="grow" />
        <div className="flex flex-col items-stretch justify-start py-4 text-sm gap-2">
          <JoinedChip
            label="Monthly Interest"
            value={`${lender.monthlyInterest}%`}
          />
          <JoinedChip label="Admin Fee" value={`${lender.adminFee}%`} />
          <JoinedChip
            label="Application Fee"
            value={`${lender.applicationFee.toLocaleString()}%`}
          />
        </div>
      </div>
      <div className="flex flex-col items-stretch p-4">
        <PrimaryButtonLink
          to={`${AppLinks.Apply}?selectedLenderId=${lender.id}`}
        >
          Apply For Loan
        </PrimaryButtonLink>
      </div>
    </Card>
  );
}

interface Props {
  label: string;
  value: string;
}
function JoinedChip(props: Props) {
  const { label, value } = props;

  return (
    <div className="grid grid-cols-3 border border-stone-200/60 rounded-lg divide-x divide-stone-200">
      <span className="flex flex-col justify-center items-start font-light col-span-2 py-2 px-4">
        {label}
      </span>
      <span className="flex flex-col justify-center items-end font-semibold py-2 px-4 bg-stone-200/60">
        {value}
      </span>
    </div>
  );
}
