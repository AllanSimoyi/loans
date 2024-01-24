import type { Fetcher } from '@remix-run/react';
import type { ComponentProps } from 'react';

import { useCallback, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { useForm } from '~/components/ActionContextProvider';
import { Card } from '~/components/Card';
import { CardSection } from '~/components/CardSection';
import { CreateApplicationSchema } from '~/models/application.validations';

import { FormTextField } from './FormTextField';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export interface Props {
  isOpen: boolean;
  actionData: Pick<Fetcher, 'data' | 'state'>;
}

export function PriorLoanDetails(props: Props) {
  const { actionData, isOpen } = props;

  const { getNameProp, isProcessing } = useForm(
    actionData,
    CreateApplicationSchema,
  );

  const [open, setOpen] = useState(isOpen);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <Card>
      <CardSection
        className="md:flex-row md:items-center"
        noBottomBorder={!open}
      >
        <span>7. Have A Prior Loan?</span>
        <div className="grow" />
        <div className="flex flex-row items-stretch">
          <CustomButton
            key="Yes"
            onClick={handleOpen}
            disabled={isProcessing}
            isOpen={open}
            className={twMerge(
              'rounded-r-none px-6',
              !open && 'text-stone-600',
            )}
          >
            Yes
          </CustomButton>
          <CustomButton
            key="No"
            onClick={handleClose}
            disabled={isProcessing}
            isOpen={!open}
            className={twMerge('rounded-l-none px-6', open && 'text-stone-600')}
          >
            No
          </CustomButton>
        </div>
      </CardSection>
      {open && (
        <CardSection className="gap-4" noBottomBorder>
          <FormTextField
            {...getNameProp('priorLoanLender')}
            label="Lender"
            placeholder="Lender"
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormTextField
              {...getNameProp('priorLoanExpiryDate')}
              type="date"
              label="Expiry Date"
              placeholder="Expiry Date"
            />
            <FormTextField
              {...getNameProp('priorLoanAmount')}
              type="number"
              step={0.01}
              min={0}
              label="Amount"
              placeholder="Amount"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormTextField
              {...getNameProp('priorLoanMonthlyRepayment')}
              type="number"
              step={0.01}
              min={0}
              label="Monthly Repayment"
              placeholder="Monthly Repayment"
            />
            <FormTextField
              {...getNameProp('priorLoanBalance')}
              type="number"
              step={0.01}
              min={0}
              label="Balance"
              placeholder="Balance"
            />
          </div>
        </CardSection>
      )}
    </Card>
  );
}

interface CustomButtonProps
  extends ComponentProps<'button'>,
    ComponentProps<typeof SecondaryButton> {
  isOpen: boolean;
}
function CustomButton(props: CustomButtonProps) {
  const { isOpen, className, ...restOfProps } = props;

  if (isOpen) {
    return (
      <PrimaryButton
        className={twMerge('py-1 text-sm', className)}
        {...restOfProps}
      />
    );
  }
  return (
    <SecondaryButton
      className={twMerge('py-1 text-sm', className)}
      {...restOfProps}
    />
  );
}
