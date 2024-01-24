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
export function Credentials(props: Props) {
  const { actionData } = props;
  const { getNameProp } = useForm(actionData, CreateApplicationSchema);

  return (
    <Card>
      <CardHeading>8. Track Application</CardHeading>
      <CardSection className="gap-4" noBottomBorder>
        <FormTextField
          {...getNameProp('emailAddress')}
          type="email"
          label="Email Address"
          placeholder="Email Address"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('password')}
            type="password"
            label="Password"
            placeholder="Password"
          />
          <FormTextField
            {...getNameProp('passwordConfirmation')}
            type="password"
            label="Re-enter Password"
            placeholder="Re-enter Password"
          />
        </div>
      </CardSection>
    </Card>
  );
}
