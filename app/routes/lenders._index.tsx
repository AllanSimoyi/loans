import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { twMerge } from 'tailwind-merge';

import { RouteErrorBoundary } from '~/components/Boundaries';
import { Card } from '~/components/Card';
import { CardSection } from '~/components/CardSection';
import { CenteredView } from '~/components/CenteredView';
import { PrimaryButtonLink } from '~/components/PrimaryButton';
import { Td, Th } from '~/components/Table';
import { Toolbar } from '~/components/Toolbar';
import { UnderLineOnHover } from '~/components/UnderLineOnHover';
import { prisma } from '~/db.server';
import { UserType } from '~/models/auth.validations';
import { StatusCode } from '~/models/core.validations';
import { AppLinks } from '~/models/links';
import { requireUser } from '~/session.server';
import { useUser } from '~/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.kind !== UserType.Admin) {
    throw new Response(
      "You're not authorised to view the lender management page",
      { status: StatusCode.Forbidden },
    );
  }

  const lenders = await prisma.lender
    .findMany({
      where: { deactivated: false },
      select: {
        id: true,
        user: { select: { fullName: true, emailAddress: true } },
        channels: {
          select: { decisions: { select: { id: true, decision: true } } },
        },
        createdAt: true,
      },
    })
    .then((lenders) =>
      lenders.sort((a, b) => b.channels.length - a.channels.length),
    );

  return json({ lenders });
}

export default function LendersIndex() {
  const currentUser = useUser();
  const { lenders } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={currentUser} />
      <CenteredView innerProps={{ className: twMerge('gap-4 px-4 py-8') }}>
        <Card>
          <CardSection className="items-center justify-center md:flex-row">
            <h2>Lenders</h2>
            <div className="grow" />
            <PrimaryButtonLink to={AppLinks.AddLender}>
              Add Lender
            </PrimaryButtonLink>
          </CardSection>
          <CardSection noBottomBorder>
            <table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th className="text-end"># of Applications</Th>
                </tr>
              </thead>
              <tbody>
                {lenders.map((lender) => {
                  return (
                    <tr key={lender.id}>
                      <Td>
                        <div className="flex flex-col items-start">
                          <UnderLineOnHover>
                            <Link
                              to={AppLinks.Lender(lender.id)}
                              title={lender.user.fullName}
                              className="text-blue-600 print:text-stone-800"
                            >
                              {lender.user.fullName}
                            </Link>
                          </UnderLineOnHover>
                        </div>
                      </Td>
                      <Td>{lender.user.emailAddress}</Td>
                      <Td className="text-end">{lender.channels.length}</Td>
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

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
