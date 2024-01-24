import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';

import { Form, json, useLoaderData, useNavigation } from '@remix-run/react';
import { X } from 'tabler-icons-react';
import { z } from 'zod';

import { ActionContextProvider } from '~/components/ActionContextProvider';
import { Card } from '~/components/Card';
import { Catalog } from '~/components/Catalog';
import { CenteredView } from '~/components/CenteredView';
import { Footer } from '~/components/Footer';
import { FormSelect } from '~/components/FormSelect';
import { FormTextField } from '~/components/FormTextField';
import { PrimaryButton } from '~/components/PrimaryButton';
import { Toolbar } from '~/components/Toolbar';
import { prisma } from '~/db.server';
import { StatusCode, getQueryParams } from '~/models/core.validations';
import { useOptionalUser } from '~/utils';

import banner from '../../public/images/stacks.png';

export const meta: MetaFunction = () => [{ title: 'Quick Loans' }];

const Schema = z.object({
  employmentTypeId: z.coerce.number().int().min(0).optional(),
  requiredAmount: z.coerce.number().min(0).optional(),
  repaymentPeriod: z.coerce.number().int().min(0).optional(),
});
export async function loader({ request }: LoaderFunctionArgs) {
  const queryParams = getQueryParams(request.url, [
    'employmentTypeId',
    'requiredAmount',
    'repaymentPeriod',
  ]);
  const result = Schema.safeParse(queryParams);
  if (!result.success) {
    throw new Response('Invalid filter input, please try again', {
      status: StatusCode.BadRequest,
    });
  }
  const { employmentTypeId, requiredAmount, repaymentPeriod } = result.data;

  const [employmentTypes, lenders] = await Promise.all([
    prisma.employmentType.findMany(),
    prisma.lender
      .findMany({
        where: {
          deactivated: false,
          employmentPreferences: employmentTypeId
            ? { some: { employmentTypeId } }
            : undefined,
          minAmount: requiredAmount ? { gte: requiredAmount } : undefined,
          maxAmount: requiredAmount ? { lte: requiredAmount } : undefined,
          minTenure: repaymentPeriod ? { gte: repaymentPeriod } : undefined,
          maxTenure: repaymentPeriod ? { lte: repaymentPeriod } : undefined,
        },
        select: {
          id: true,
          user: { select: { fullName: true } },
          logo: true,
          minTenure: true,
          maxTenure: true,
          minAmount: true,
          maxAmount: true,
          employmentPreferences: {
            select: {
              employmentType: { select: { id: true, employmentType: true } },
            },
          },
          monthlyInterest: true,
          adminFee: true,
          applicationFee: true,
        },
      })
      .then((lenders) =>
        lenders
          .sort((a, b) => 0.5 - Math.random())
          .map((lender) => ({
            ...lender,
            name: lender.user.fullName,
            minAmount: Number(lender.minAmount),
            maxAmount: Number(lender.maxAmount),
            monthlyInterest: Number(lender.monthlyInterest),
            adminFee: Number(lender.adminFee),
            applicationFee: Number(lender.applicationFee),
            employmentPreferences: lender.employmentPreferences.map(
              (el) => el.employmentType.employmentType,
            ),
          })),
      ),
  ]);

  return json({ employmentTypes, lenders, fields: result.data });
}

export default function Index() {
  const user = useOptionalUser();
  const { employmentTypes, lenders, fields } = useLoaderData<typeof loader>();

  const nav = useNavigation();
  const isProcessing = nav.state !== 'idle';

  const tags = [
    fields?.employmentTypeId
      ? employmentTypes.find((el) => el.id === fields?.employmentTypeId)
          ?.employmentType
      : undefined,
    fields?.requiredAmount
      ? `ZWL ${fields?.requiredAmount.toLocaleString()}`
      : undefined,
    fields?.repaymentPeriod
      ? `To be repaid in ${fields?.repaymentPeriod} months`
      : undefined,
  ].filter(Boolean);

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={user} />
      <div className="flex h-[80vh] flex-col items-stretch bg-blue-600 py-4 lg:h-[80vh]">
        <CenteredView className="grow">
          <div className="flex grow flex-col items-center justify-center p-4 lg:flex-row lg:justify-start">
            <div className="flex w-full flex-col items-center justify-center gap-12 py-4 lg:w-[70%] lg:items-start lg:py-8">
              <h2 className="text-center text-4xl text-white md:text-6xl lg:text-start">
                Get Quick Loans
              </h2>
              <div className="hidden grow md:flex" />
              <div className="flex flex-col items-center gap-2 md:items-stretch">
                <ul className="list-none text-base text-white md:text-xl">
                  <li className="my-4">
                    &middot; Tell us what you're looking for
                  </li>
                  <li className="my-4">
                    &middot; Choose between matching loans on offer
                  </li>
                  <li className="my-4">
                    &middot; Provide relevant details and that's it
                  </li>
                </ul>
              </div>
            </div>
            <div className="hidden grow flex-row items-center lg:flex">
              <img
                src={banner}
                className="h-[50vh] object-contain"
                alt="Money"
              />
            </div>
          </div>
        </CenteredView>
      </div>
      <div className="-mt-12 flex flex-col items-stretch px-4 lg:p-0">
        <CenteredView>
          <Form method="get" className="flex flex-col items-stretch">
            <ActionContextProvider fields={fields} isSubmitting={isProcessing}>
              <Card className="grow rounded-lg bg-white shadow-2xl">
                <div className="flex flex-col items-stretch gap-4 p-4 lg:flex-row">
                  <div className="flex grow basis-[33%] flex-col items-stretch">
                    <FormSelect
                      name="employmentTypeId"
                      label="Your Type Of Work"
                    >
                      <option value="">All Types of Work</option>
                      {employmentTypes.map((employentType) => (
                        <option key={employentType.id} value={employentType.id}>
                          {employentType.employmentType}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                  <div className="flex grow basis-[33%] flex-col items-stretch">
                    <FormTextField
                      name="requiredAmount"
                      step=".01"
                      type="number"
                      label="How much you want (ZWL)"
                      placeholder="E.g. 45000"
                    />
                  </div>
                  <div className="flex grow basis-[33%] flex-col items-stretch">
                    <FormTextField
                      name="repaymentPeriod"
                      type="number"
                      min={1}
                      label="How long to pay back (Months)"
                      placeholder="E.g. 4"
                    />
                  </div>
                </div>
                <div className="invisible absolute flex flex-col items-end justify-center px-4 py-2">
                  <PrimaryButton type="submit" disabled={isProcessing}>
                    {isProcessing ? 'SEARCHING...' : 'FIND MATCHING LOANS'}
                  </PrimaryButton>
                </div>
              </Card>
            </ActionContextProvider>
          </Form>
        </CenteredView>
      </div>
      <div className="flex flex-col items-stretch border-b border-b-stone-400 px-4 py-16 lg:px-0">
        <CenteredView>
          <div className="flex flex-row items-center gap-4 pb-8">
            <span className="text-2xl font-normal">
              {lenders.length} available{' '}
              {lenders.length === 1 ? 'loan' : 'loans'}
            </span>
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex flex-row items-center gap-4 rounded-full bg-black/10 px-4 py-1"
              >
                <span className="text-sm font-normal">{tag}</span>
                <X className="text-red-600" />
              </div>
            ))}
          </div>
          <Catalog lenders={lenders} userType={user?.kind} />
        </CenteredView>
      </div>
      <Footer />
    </div>
  );
}
