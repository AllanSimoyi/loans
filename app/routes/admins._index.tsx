import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import type { FormEvent } from 'react';

import { json, redirect } from '@remix-run/node';
import { Link, useFetcher, useLoaderData } from '@remix-run/react';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

import { useForm } from '~/components/ActionContextProvider';
import { RouteErrorBoundary } from '~/components/Boundaries';
import { Card } from '~/components/Card';
import { CardSection } from '~/components/CardSection';
import { CenteredView } from '~/components/CenteredView';
import { DangerButton } from '~/components/DangerButton';
import { PrimaryButtonLink } from '~/components/PrimaryButton';
import { Td, Th } from '~/components/Table';
import { Toolbar } from '~/components/Toolbar';
import { UnderLineOnHover } from '~/components/UnderLineOnHover';
import { prisma } from '~/db.server';
import { UserType } from '~/models/auth.validations';
import {
  ComposeRecordIdSchema,
  StatusCode,
  badRequest,
  processBadRequest,
} from '~/models/core.validations';
import { getErrorMessage } from '~/models/errors';
import { getRawFormFields } from '~/models/forms';
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
  const admins = await prisma.user.findMany({
    where: { kind: UserType.Admin },
    select: { id: true, emailAddress: true, fullName: true },
  });

  return json({ admins });
}

const Schema = z.object({
  adminId: ComposeRecordIdSchema('admin'),
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
    const { adminId } = result.data;
    await prisma.user.delete({
      where: { id: adminId },
    });
    return redirect(AppLinks.Admins);
  } catch (error) {
    return badRequest({ formError: getErrorMessage(error) });
  }
}

export default function AdminsIndex() {
  const currentUser = useUser();
  const { admins } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col items-stretch">
      <Toolbar currentUser={currentUser} />
      <CenteredView
        innerProps={{
          className: twMerge('gap-4 px-4 py-8 md:w-[80%] lg:w-[60%]'),
        }}
      >
        <Card>
          <CardSection className="items-center justify-center md:flex-row">
            <h2>Admins</h2>
            <div className="grow" />
            <PrimaryButtonLink to={AppLinks.AddAdmin}>
              Add Admin
            </PrimaryButtonLink>
          </CardSection>
          <CardSection noBottomBorder>
            <table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  return <Row key={admin.id} admin={admin} />;
                })}
              </tbody>
            </table>
          </CardSection>
        </Card>
      </CenteredView>
    </div>
  );
}

interface Props {
  admin: { id: number; fullName: string; emailAddress: string };
}
function Row(props: Props) {
  const { admin } = props;

  const fetcher = useFetcher<typeof action>();
  const { getNameProp, isProcessing } = useForm(fetcher, Schema);

  function handleDeleteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window) {
      return;
    }
    const confirmed = window.confirm('Are you sure');
    if (!confirmed) {
      return;
    }
    fetcher.submit(event.currentTarget);
  }

  return (
    <tr key={admin.id}>
      <Td>
        <div className="flex flex-col items-start">
          <UnderLineOnHover>
            <Link
              to={AppLinks.EditAdmin(admin.id)}
              title={admin.fullName}
              className="text-blue-600 print:text-stone-800"
            >
              {admin.fullName}
            </Link>
          </UnderLineOnHover>
        </div>
      </Td>
      <Td>{admin.emailAddress}</Td>
      <Td>
        <fetcher.Form
          method="post"
          onSubmit={handleDeleteSubmit}
          className="flex flex-col items-stretch"
        >
          <input type="hidden" {...getNameProp('adminId')} value={admin.id} />
          <DangerButton type="submit" disabled={isProcessing}>
            {isProcessing ? 'Deleting...' : 'Delete'}
          </DangerButton>
        </fetcher.Form>
      </Td>
    </tr>
  );
}

export function ErrorBoundary() {
  return <RouteErrorBoundary />;
}
