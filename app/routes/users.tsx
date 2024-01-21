import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { prisma } from '~/db.server';
import { UserType } from '~/models/auth.validations';

export async function loader({ request }: LoaderFunctionArgs) {
  const users = await prisma.user.findMany({
    select: { emailAddress: true, kind: true },
  });
  return json({ users });
}

export default function Users() {
  const { users } = useLoaderData<typeof loader>();

  const admins = users.filter((user) => user.kind === UserType.Admin);
  const lenders = users.filter((user) => user.kind === UserType.Lender);
  const applicants = users.filter((user) => user.kind === UserType.Applicant);

  const groups = [
    ['Admins', admins],
    ['Lenders', lenders],
    ['Applicants', applicants],
  ] as const;

  return (
    <div className="flex flex-col items-stretch gap-8 p-8">
      {groups.map(([kind, users]) => (
        <div key={kind} className="flex flex-col items-stretch gap-4">
          <span className="text-lg font-semibold">{kind}</span>
          <div className="flex flex-col items-stretch gap-2">
            {users.map((user) => (
              <span key={user.emailAddress} className="font-light">
                {user.emailAddress}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
