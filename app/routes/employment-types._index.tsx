import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { RouteErrorBoundary } from '~/components/Boundaries';
import { prisma } from '~/db.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const numRecords = await prisma.employmentType.count();
  return json({ numRecords });
}

export default function EmploymentTypesIndex() {
  const { numRecords } = useLoaderData<typeof loader>();
  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <span className="text-lg font-light text-stone-400">
        {numRecords} employment type(s) found
      </span>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
