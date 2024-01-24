import type { LoaderFunctionArgs } from '@remix-run/node';
import type { ComponentProps } from 'react';

import { json, useLoaderData } from '@remix-run/react';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import { RouteErrorBoundary } from '~/components/Boundaries';
import { StatusCode, formatAmount } from '~/models/core.validations';
import { traverseFile } from '~/models/custom-fs';
import { DATE_INPUT_FORMAT } from '~/models/dates';

const Schema = z.preprocess(
  (arg) => {
    if (typeof arg === 'string') {
      try {
        return JSON.parse(arg);
      } catch (error) {
        return undefined;
      }
    }
  },
  z.object({
    data: z
      .object({
        state: z.string(),
        loanPurpose: z.string(),
        amtRequired: z.coerce.number(),
        repaymentPeriod: z.coerce.number(),
        resAddress: z.string(),
        natureOfRes: z.string(),
        maritalStatus: z.string(),
        profession: z.string(),
        employer: z.string(),
        employedSince: z.string(),
        grossIncome: z.coerce.number(),
        netIncome: z.coerce.number(),
      })
      .array(),
  }),
);

export async function loader({ request }: LoaderFunctionArgs) {
  const rawData = await traverseFile('application.json');
  const result = Schema.safeParse(rawData);
  if (!result.success) {
    throw new Response(result.error.message, { status: StatusCode.BadRequest });
  }
  return json({ applications: result.data.data });
}

export default function Zlo() {
  const { applications } = useLoaderData<typeof loader>();

  const approved = applications.filter((app) => app.state === 'Approved');
  const pending = applications.filter((app) => app.state === 'Pending');
  const declined = applications.filter((app) => app.state === 'Declined');

  const relevant = [...approved, ...pending, ...declined];

  return (
    <div className="flex flex-col items-stretch gap-4 overflow-auto p-8">
      <div className="flex flex-col items-stretch">
        <span className="text-stone-600">
          Loan Applications As At 12 Jan 2024
        </span>
      </div>
      <div className="flex flex-col items-stretch gap-4">
        {relevant.map((app, index) => (
          <div
            key={index}
            className="flex flex-row items-stretch gap-4 rounded-lg border border-stone-100 bg-stone-100 p-6 shadow-xl"
          >
            <div className="flex flex-col items-stretch">
              <span className="text-xs text-stone-400">#</span>
              <span className="text-sm text-stone-600">{index + 1}.</span>
            </div>
            <div className="grid grow grid-cols-1 gap-4 lg:grid-cols-4">
              <GridItem
                label="Amount"
                value={`ZWL ${formatAmount(app.amtRequired)}`}
              />
              <GridItem
                label="Repayment Period"
                value={app.repaymentPeriod.toString()}
              />
              <GridItem label="Purpose of Loan" value={app.loanPurpose} />
              <GridItem label="Address" value={app.resAddress} />
              <GridItem label="Nature Of Residence" value={app.natureOfRes} />
              <GridItem label="Marital Status" value={app.maritalStatus} />
              <GridItem label="Profession" value={app.profession} />
              <GridItem label="Employer" value={app.employer} />
              <GridItem
                label="Employed Since"
                value={dayjs(app.employedSince).format(DATE_INPUT_FORMAT)}
              />
              <GridItem
                label="Gross Income"
                value={`ZWL ${formatAmount(app.grossIncome)}`}
              />
              <GridItem
                label="Net Income"
                value={`ZWL ${formatAmount(app.netIncome)}`}
              />
              <GridItem
                label="State"
                value={app.state}
                className={twMerge(
                  app.state === 'Approved' && 'text-green-600',
                  app.state === 'Pending' && 'text-stone-600',
                  app.state === 'Declined' && 'text-red-600',
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GridItemProps extends ComponentProps<'div'> {
  label: string;
  value: string;
}
function GridItem(props: GridItemProps) {
  const { label, value, className } = props;
  return (
    <div className="flex flex-col items-stretch">
      <span className="text-xs text-stone-400">{label}</span>
      <span className={twMerge('text-sm text-stone-600', className)}>
        {value}
      </span>
    </div>
  );
}

// function Th({ children }: ComponentProps<'td'>) {
//   return (
//     <th className="border border-stone-400 px-2 py-1 text-start">{children}</th>
//   );
// }

// function Td(props: ComponentProps<'td'>) {
//   const { children, className } = props;
//   return (
//     <td
//       className={twMerge(
//         'text-nowrap border border-stone-400 px-2 py-1',
//         className,
//       )}
//     >
//       {children}
//     </td>
//   );
// }

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
