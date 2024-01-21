import type { LoaderFunctionArgs } from '@remix-run/node';

import { RouteErrorBoundary } from '~/components/Boundaries';

export async function loader({ request }: LoaderFunctionArgs) {
  return null;
}

export default function LendersAdd() {
  return (
    <div>
      <h1>Unknown Route</h1>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
