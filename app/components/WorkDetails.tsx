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
export function WorkDetails(props: Props) {
  const { actionData } = props;
  const { getNameProp } = useForm(actionData, CreateApplicationSchema);

  return (
    <Card>
      <CardHeading>4. Work Details</CardHeading>
      <CardSection className="gap-6" noBottomBorder>
        <FormTextField
          {...getNameProp('profession')}
          label="Profession"
          placeholder="Profession"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('employer')}
            label="Employer"
            placeholder="Employer"
          />
          <FormTextField
            {...getNameProp('employedSince')}
            type="date"
            label="Employed Since"
            placeholder="Employed Since"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('grossIncome')}
            type="number"
            step={0.01}
            min={0}
            label="Gross Monthly Income (ZWL)"
            placeholder="Gross Monthly Income (ZWL)"
          />
          <FormTextField
            {...getNameProp('netIncome')}
            type="number"
            step={0.01}
            min={0}
            label="Net Monthly Income (ZWL)"
            placeholder="Net Monthly Income (ZWL)"
          />
        </div>
      </CardSection>
    </Card>
  );
}
