import type { Fetcher } from '@remix-run/react';

import { Card } from '~/components/Card';
import { CardHeading } from '~/components/CardHeading';
import { CardSection } from '~/components/CardSection';
import { CreateApplicationSchema } from '~/models/application.validations';

import { useForm } from './ActionContextProvider';
import { FormSelect } from './FormSelect';
import { FormTextArea } from './FormTextArea';
import { FormTextField } from './FormTextField';

export interface Props {
  lenders: { id: number; lenderName: string }[];
  actionData: Pick<Fetcher, 'data' | 'state'>;
}
export function LoanDetails(props: Props) {
  const { lenders, actionData } = props;
  const { getNameProp } = useForm(actionData, CreateApplicationSchema);

  return (
    <Card>
      <CardHeading>2. Loan Details</CardHeading>
      <CardSection className="gap-6" noBottomBorder>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormSelect
            {...getNameProp('selectedLenderId')}
            label="Select Lender"
          >
            {lenders.map((lender) => (
              <option key={lender.id} value={lender.id}>
                {lender.lenderName}
              </option>
            ))}
          </FormSelect>
          <FormTextField
            {...getNameProp('loanPurpose')}
            label="Purpose of Loan"
            placeholder="Purpose of Loan"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('amtRequired')}
            type="number"
            step={0.01}
            min={0}
            label="Amount Required (ZWL)"
            placeholder="Amount Required"
          />
          <FormTextField
            {...getNameProp('repaymentPeriod')}
            type="number"
            step={1}
            min={0}
            label="Repayment Period (In Months)"
            placeholder="Repayment Period"
          />
        </div>
        <FormTextArea
          {...getNameProp('moreDetail')}
          label="Describe Your Application (Optional)"
          placeholder="Describe Your Application"
        />
      </CardSection>
    </Card>
  );
}
