import { UserType } from '~/models/auth.validations';
import { AppLinks } from '~/models/links';
import { capitalize } from '~/models/strings';

import { Card } from './Card';
import { PrimaryButton, PrimaryButtonLink } from './PrimaryButton';

type LenderProps = {
  id: number;
  name: string;
  logo: string;
  minAmount: number;
  maxAmount: number;
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

export function LenderGridItem(
  props: LenderGridItemProps & { userType: UserType | undefined },
) {
  const { lender, userType } = props;

  const details: [string, string][] = [
    ['Min Amount Offered', `ZWL ${lender.minAmount}`],
    ['Max Amount Offered', `ZWL ${lender.maxAmount}`],
    ['Monthly Interest', `${lender.monthlyInterest}%`],
    ['Amin Fee', `${lender.adminFee}%`],
    ['Application Fee', `${lender.applicationFee.toLocaleString()}%`],
  ];

  const canApply = userType ? userType === UserType.Applicant : false;

  return (
    <Card className="h-full rounded-lg bg-white">
      <div className="flex flex-row items-center gap-2 border-b border-dashed border-stone-200 p-4">
        <div className="flex flex-col items-center justify-center">
          {lender.logo ? (
            <img className="rounded-full" alt={lender.name} src={lender.logo} />
          ) : (
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-stone-200/60 p-2">
              <span>{capitalize(lender.name.charAt(0))}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-0">
          <span className="font-normal">{lender.name}</span>
          {Boolean(lender.maxTenure) && (
            <span className="text-sm font-light">
              Loans must be repaid in <b>{lender.minTenure}</b> to{' '}
              <b>{lender.maxTenure} months</b>
            </span>
          )}
        </div>
      </div>
      <div className="items-stretchv flex grow flex-col p-4">
        {!!lender.employmentPreferences.length && (
          <span className="px-4 text-sm font-light">
            Giving loans to{' '}
            {lender.employmentPreferences.map((pref) => (
              <span className="mr-2 font-semibold" key={pref}>
                {pref}
              </span>
            ))}
          </span>
        )}
        <div className="grow" />
        <div className="flex flex-col items-stretch justify-start gap-2 py-4 text-sm">
          {details.map(([label, value]) => (
            <JoinedChip key={label} label={label} value={value} />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-stretch p-4">
        {!!canApply && (
          <PrimaryButtonLink
            to={`${AppLinks.Apply}?selectedLenderId=${lender.id}`}
          >
            Apply For Loan
          </PrimaryButtonLink>
        )}
        {!canApply && (
          <PrimaryButton disabled={true}>
            Login as applicant to apply
          </PrimaryButton>
        )}
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
    <div className="grid grid-cols-3 divide-x divide-stone-200 rounded-lg border border-stone-200/60">
      <span className="col-span-2 flex flex-col items-start justify-center px-4 py-2 font-light">
        {label}
      </span>
      <span className="flex flex-col items-end justify-center bg-stone-200/60 px-4 py-2 font-semibold">
        {value}
      </span>
    </div>
  );
}
