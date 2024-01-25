import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

import { json } from '@remix-run/node';
import {
  Form,
  Link,
  Outlet,
  useFetcher,
  useLoaderData,
} from '@remix-run/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { X } from 'tabler-icons-react';
import { z } from 'zod';

import { useForm } from '~/components/ActionContextProvider';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { Card } from '~/components/Card';
import { CardSection } from '~/components/CardSection';
import { CenteredView } from '~/components/CenteredView';
import { GhostButtonLink } from '~/components/GhostButton';
import { SecondaryButton } from '~/components/SecondaryButton';
import { Toolbar } from '~/components/Toolbar';
import { UnderLineOnHover } from '~/components/UnderLineOnHover';
import { prisma } from '~/db.server';
import { UserType } from '~/models/auth.validations';
import {
  ComposeRecordIdSchema,
  StatusCode,
  badRequest,
  hasSuccess,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields, hasFormError } from '~/models/forms';
import { AppLinks } from '~/models/links';
import { requireUser } from '~/session.server';
import { useUser } from '~/utils';

export async function loader({ request }: LoaderFunctionArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.kind !== UserType.Admin) {
    throw new Response("You're not authorised to view this page", {
      status: StatusCode.Forbidden,
    });
  }

  const employmentTypes = await prisma.employmentType.findMany();

  return json({ employmentTypes });
}

const Schema = z.object({
  id: ComposeRecordIdSchema('employment type'),
});
export async function action({ request }: ActionFunctionArgs) {
  const currentUser = await requireUser(request);
  if (currentUser.kind !== UserType.Admin) {
    throw new Response("You're not authorised to view this page", {
      status: StatusCode.Forbidden,
    });
  }

  try {
    const fields = await getRawFormFields(request);
    const result = Schema.safeParse(fields);
    if (!result.success) {
      return processBadRequest(result.error, fields);
    }
    const { id } = result.data;

    await prisma.$transaction(async (tx) => {
      await tx.employmentPreference.deleteMany({
        where: { employmentTypeId: id },
      });
      await tx.employmentType.delete({
        where: { id },
      });
    });

    return json({ success: true });
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function EmploymentTypes() {
  const user = useUser();
  const { employmentTypes } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-full flex-col items-stretch">
      <Toolbar currentUser={user} />
      <CenteredView
        className="grow"
        innerProps={{ className: 'grow gap-4 px-4 py-8 md:w-[80%] lg:w-[60%]' }}
      >
        <Card className="grow">
          <CardSection>
            <div className="flex flex-col items-center justify-center md:flex-row">
              <h2>Employment Types</h2>
              <div className="grow" />
              <GhostButtonLink to={AppLinks.AddEmploymentType}>
                Add Employment Type
              </GhostButtonLink>
            </div>
          </CardSection>
          <CardSection className="grow p-0 md:flex-row" noBottomBorder>
            <div className="flex max-h-screen flex-col items-stretch overflow-y-scroll border-r border-dashed border-stone-300 bg-white/80 p-2">
              {employmentTypes.map((employmentType) => (
                <ListItem key={employmentType.id} {...employmentType} />
              ))}
            </div>
            <div className="flex grow flex-col items-stretch">
              <Outlet />
            </div>
          </CardSection>
        </Card>
      </CenteredView>
    </div>
  );
}

interface Props {
  id: number;
  employmentType: string;
}
function ListItem(props: Props) {
  const { employmentType, id } = props;

  const fetcher = useFetcher<typeof action>();
  const { getNameProp, isProcessing } = useForm(fetcher, Schema);

  useEffect(() => {
    if (hasSuccess(fetcher.data)) {
      toast.success('Item deleted successfully!');
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (hasFormError(fetcher.data)) {
      toast.error(fetcher.data.formError);
    }
  }, [fetcher.data]);

  return (
    <div className="flex flex-row items-center gap-8 rounded p-2">
      <UnderLineOnHover>
        <Link
          prefetch="intent"
          className="text-blue-600"
          to={AppLinks.EditEmploymentType(id)}
        >
          {employmentType}
        </Link>
      </UnderLineOnHover>
      <div className="grow" />
      <Form method="post" className="flex flex-col items-stretch">
        <input type="hidden" {...getNameProp('id')} value={id} />
        <SecondaryButton
          className="bg-transparent p-1"
          type="submit"
          disabled={isProcessing}
        >
          <X size={20} className="text-red-600" />
        </SecondaryButton>
      </Form>
    </div>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
