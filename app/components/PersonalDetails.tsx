import type { Fetcher } from '@remix-run/react';

import {
  CreateApplicationSchema,
  MaritalStatus,
  NatureOfRes,
} from '~/models/application.validations';

import { useForm } from './ActionContextProvider';
import { Card } from './Card';
import { CardHeading } from './CardHeading';
import { CardSection } from './CardSection';
import { FormSelect } from './FormSelect';
import { FormTextField } from './FormTextField';

interface Props {
  actionData: Pick<Fetcher, 'data' | 'state'> | undefined;
}
export function PersonalDetails(props: Props) {
  const { actionData } = props;
  const { getNameProp } = useForm(actionData, CreateApplicationSchema);

  return (
    <Card>
      <CardHeading>1. Personal Details</CardHeading>
      <CardSection className="gap-6" noBottomBorder>
        <input type="hidden" {...getNameProp('fullMaidenNames')} value="" />
        <input type="hidden" {...getNameProp('fullNameOfSpouse')} value="" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormSelect {...getNameProp('title')} label="Title">
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Miss">Miss</option>
            <option value="Dr">Dr</option>
            <option value="Prof">Prof</option>
          </FormSelect>
          <FormTextField
            {...getNameProp('fullName')}
            label="Full Name"
            placeholder="Full Name"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormTextField
            type="date"
            {...getNameProp('DOB')}
            label="Date Of Birth"
            placeholder="Date Of Birth"
          />
          <FormSelect {...getNameProp('maritalStatus')} label="Marital Status">
            <option value={MaritalStatus.Single}>{MaritalStatus.Single}</option>
            <option value={MaritalStatus.Married}>
              {MaritalStatus.Married}
            </option>
          </FormSelect>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('nationalID')}
            label="National ID (##-######-A##)"
            placeholder="National ID"
          />
          <FormTextField
            {...getNameProp('phoneNumber')}
            label="Phone Number"
            placeholder="Phone Number"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FormTextField
            {...getNameProp('resAddress')}
            label="Residential Address"
            placeholder="Residential Address"
          />
          <FormSelect
            {...getNameProp('natureOfRes')}
            label="Nature of Residence"
          >
            <option value={NatureOfRes.Owned}>{NatureOfRes.Owned}</option>
            <option value={NatureOfRes.Rented}>{NatureOfRes.Rented}</option>
            <option value={NatureOfRes.Mortgaged}>
              {NatureOfRes.Mortgaged}
            </option>
            <option value={NatureOfRes.ProvidedByEmployer}>
              {NatureOfRes.ProvidedByEmployer}
            </option>
            <option value={NatureOfRes.StayingWithParents}>
              {NatureOfRes.StayingWithParents}
            </option>
          </FormSelect>
        </div>
      </CardSection>
    </Card>
  );
}
