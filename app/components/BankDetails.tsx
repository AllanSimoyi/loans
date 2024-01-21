import type { Fetcher } from '@remix-run/react';

import { Card } from '~/components/Card';
import { CardHeading } from '~/components/CardHeading';
import { CardSection } from '~/components/CardSection';
import { CreateApplicationSchema } from '~/models/application.validations';

import { useForm } from './ActionContextProvider';
import { FormTextField } from './FormTextField';

interface Props {
  actionData: Pick<Fetcher, 'data' | 'state'>;
}
export function BankDetails(props: Props) {
  const { actionData } = props;
  const { getNameProp } = useForm(actionData, CreateApplicationSchema);

  return (
    <Card>
      <CardHeading>3. Bank Details</CardHeading>
      <CardSection className="gap-6" noBottomBorder>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('bank')}
            label="Bank"
            placeholder="Bank"
          />
          <FormTextField
            {...getNameProp('bankBranch')}
            label="Bank Branch"
            placeholder="Bank Branch"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('accNumber')}
            label="Account Number"
            placeholder="Account Number"
          />
          <FormTextField
            {...getNameProp('accName')}
            label="Account Name"
            placeholder="Account Name"
          />
        </div>
      </CardSection>
    </Card>
  );
}
