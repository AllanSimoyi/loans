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
export function NextOfKinDetails(props: Props) {
  const { actionData } = props;
  const { getNameProp } = useForm(actionData, CreateApplicationSchema);

  return (
    <Card>
      <CardHeading>6. Next of Kin</CardHeading>
      <CardSection className="gap-4">
        <span className="text-lg font-bold">First Next of Kin:</span>
        <FormTextField
          {...getNameProp('firstNokFullName')}
          label="Full Name"
          placeholder="Full Name"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('firstNokRelationship')}
            label="Relationship"
            placeholder="Relationship"
          />
          <FormTextField
            {...getNameProp('firstNokPhoneNumber')}
            label="Phone Number"
            placeholder="Phone Number"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('firstNokEmployer')}
            label="Employer"
            placeholder="Employer"
          />
          <FormTextField
            {...getNameProp('firstNokResAddress')}
            label="Residential Address"
            placeholder="Residential Address"
          />
        </div>
      </CardSection>
      <CardSection className="gap-4" noBottomBorder>
        <span className="text-lg font-bold">Second Next of Kin:</span>
        <FormTextField
          {...getNameProp('secondNokFullName')}
          label="Full Name"
          placeholder="Full Name"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('secondNokRelationship')}
            label="Relationship"
            placeholder="Relationship"
          />
          <FormTextField
            {...getNameProp('secondNokPhoneNumber')}
            label="Phone Number"
            placeholder="Phone Number"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('secondNokEmployer')}
            label="Employer"
            placeholder="Employer"
          />
          <FormTextField
            {...getNameProp('secondNokResAddress')}
            label="Residential Address"
            placeholder="Residential Address"
          />
        </div>
      </CardSection>
    </Card>
  );
}
