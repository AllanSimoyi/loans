import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import dayjs from 'dayjs';
import { useEffect, type ComponentProps } from 'react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import { RouteErrorBoundary } from '~/components/Boundaries';
import { Card } from '~/components/Card';
import { CardSection } from '~/components/CardSection';
import { CenteredView } from '~/components/CenteredView';
import { PrimaryButton } from '~/components/PrimaryButton';
import { Toolbar } from '~/components/Toolbar';
import { UnderLineOnHover } from '~/components/UnderLineOnHover';
import { prisma } from '~/db.server';
import {
  getApplicationDecision,
  getDecisionColor,
} from '~/models/application.validations';
import { UserType } from '~/models/auth.validations';
import {
  formatAmount,
  getQueryParams,
  StatusCode,
} from '~/models/core.validations';
import { AppLinks } from '~/models/links';
import { requireUser } from '~/session.server';
import { useUser } from '~/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUser = await requireUser(request);

  const queryParams = getQueryParams(request.url, ['message']);
  const result = z
    .string()
    .optional()
    .nullable()
    .safeParse(queryParams.message);
  if (!result.success) {
    throw new Response('Invalid input provided for field: message', {
      status: StatusCode.BadRequest,
    });
  }
  const message = result.data;

  const applications = await (async () => {
    const lenderId =
      currentUser.kind === UserType.Lender
        ? await prisma.lender
            .findFirst({ where: { userId: currentUser.id } })
            .then((lender) => lender?.id || undefined)
        : undefined;
    return prisma.application.findMany({
      where:
        currentUser.kind === UserType.Admin
          ? undefined
          : currentUser.kind === UserType.Applicant
          ? { applicantId: currentUser.id, deactivated: false }
          : { channels: { some: { lenderId } } },
      select: {
        id: true,
        fullName: true,
        applicant: { select: { fullName: true } },
        loanPurpose: true,
        amtRequired: true,
        channels: {
          select: {
            decisions: { select: { decision: true, createdAt: true } },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      // take: 10,
    });
  })().then((applications) =>
    applications.map((application) => {
      const decisions = application.channels
        .map((channel) => channel.decisions)
        .flat()
        .map((decision) => ({
          ...decision,
          createdAt: new Date(decision.createdAt),
        }));
      const decision = getApplicationDecision(decisions);
      return {
        ...application,
        decision,
        amtRequired: Number(application.amtRequired),
      };
    }),
  );

  return json({ applications, message });
}

export default function Applications() {
  const { applications, message } = useLoaderData<typeof loader>();
  const user = useUser();

  useEffect(() => {
    if (message) {
      toast.info(message.split('_').join(' '));
    }
  }, [message]);

  function printPage() {
    if (window) {
      window.print();
    }
  }

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={user} />
      <CenteredView innerProps={{ className: twMerge('px-4 py-8 gap-4') }}>
        <Card className="print:border-none print:p-0 print:shadow-none">
          <CardSection className="py-2 print:border-none print:px-0 print:py-4">
            <div className="flex flex-row items-center justify-center">
              <h2 className="font-semibold">Applications</h2>
              <div className="grow" />
              <PrimaryButton className="print:hidden" onClick={printPage}>
                Print Table
              </PrimaryButton>
            </div>
          </CardSection>
          <CardSection noBottomBorder className="print:border-none print:p-0">
            <table>
              <thead>
                <tr>
                  <Th>Applicant</Th>
                  <Th>Date</Th>
                  <Th>Purpose</Th>
                  <Th>Decision</Th>
                  <Th className="text-end">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => {
                  return (
                    <tr key={application.id}>
                      <Td>
                        <div className="flex flex-col items-start">
                          <UnderLineOnHover>
                            <Link
                              to={AppLinks.Application(application.id)}
                              title={application.fullName}
                              className="text-blue-600 print:text-stone-800"
                            >
                              {application.fullName}
                            </Link>
                          </UnderLineOnHover>
                        </div>
                      </Td>
                      <Td>
                        {dayjs(application.createdAt).format('DD/MM/YYYY')}
                      </Td>
                      <Td>{application.loanPurpose}</Td>
                      <Td className={getDecisionColor(application.decision)}>
                        {application.decision}
                      </Td>
                      <Td className="text-end">
                        ZWL {formatAmount(application.amtRequired)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardSection>
        </Card>
      </CenteredView>
    </div>
  );
}

function Th(props: ComponentProps<'th'>) {
  const { className, ...restOfProps } = props;
  return (
    <th
      className={twMerge(
        'border border-stone-200 p-2 text-left font-normal',
        className,
      )}
      {...restOfProps}
    />
  );
}

function Td(props: ComponentProps<'td'>) {
  const { className, ...restOfProps } = props;
  return (
    <td
      className={twMerge(
        'border border-stone-200 p-2 text-left font-light',
        className,
      )}
      {...restOfProps}
    />
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
