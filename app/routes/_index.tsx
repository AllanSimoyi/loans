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

export const meta: MetaFunction = () => [{ title: 'Zim Loans Online' }];

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
      <div className="flex flex-col items-stretch h-[80vh] lg:h-[80vh] py-4 bg-indigo-600">
        <CenteredView className="grow">
          <div className="flex flex-col justify-center items-center lg:flex-row lg:justify-start p-4 grow">
            <div className="flex flex-col justify-center items-center lg:items-start gap-12 w-full lg:w-[70%] py-4 lg:py-8">
              <h2 className="text-4xl md:text-6xl text-white text-center lg:text-start">
                Get Quick Loans
              </h2>
              <div className="hidden md:flex grow" />
              <div className="flex flex-col items-center md:items-stretch gap-2">
                <ul className="text-white text-base md:text-xl list-none">
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
            <div className="lg:flex flex-row items-center grow hidden">
              <img
                src={banner}
                className="object-contain h-[50vh]"
                alt="Money"
              />
            </div>
          </div>
        </CenteredView>
      </div>
      <div className="flex flex-col items-stretch px-4 lg:p-0 -mt-12">
        <CenteredView>
          <Form method="get" className="flex flex-col items-stretch">
            <ActionContextProvider fields={fields} isSubmitting={isProcessing}>
              <Card className="grow bg-white rounded-lg shadow-2xl">
                <div className="flex flex-col items-stretch lg:flex-row p-4 gap-4">
                  <div className="flex flex-col items-stretch grow basis-[33%]">
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
                  <div className="flex flex-col items-stretch grow basis-[33%]">
                    <FormTextField
                      name="requiredAmount"
                      step=".01"
                      type="number"
                      label="How much you want (ZWL)"
                      placeholder="E.g. 45000"
                    />
                  </div>
                  <div className="flex flex-col items-stretch grow basis-[33%]">
                    <FormTextField
                      name="repaymentPeriod"
                      type="number"
                      min={1}
                      label="How long to pay back (Months)"
                      placeholder="E.g. 4"
                    />
                  </div>
                </div>
                <div className="absolute invisible flex flex-col justify-center items-end px-4 py-2">
                  <PrimaryButton type="submit" disabled={isProcessing}>
                    {isProcessing ? 'SEARCHING...' : 'FIND MATCHING LOANS'}
                  </PrimaryButton>
                </div>
              </Card>
            </ActionContextProvider>
          </Form>
        </CenteredView>
      </div>
      <div className="flex flex-col items-stretch px-4 lg:px-0 py-16 border-b border-b-gray-400">
        <CenteredView>
          <div className="flex flex-row items-center gap-6 pb-8">
            <span className="text-2xl font-normal">
              {lenders.length} available{' '}
              {lenders.length === 1 ? 'loan' : 'loans'}
            </span>
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex flex-row items-center gap-4 bg-black/10 rounded-full px-4 py-1"
              >
                <span className="font-normal text-sm">{tag}</span>
                <X className="text-red-600" />
              </div>
            ))}
          </div>
          <Catalog lenders={lenders} />
        </CenteredView>
      </div>
      <Footer />
    </div>
  );
}
