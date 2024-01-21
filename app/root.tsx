import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';

import { Cloudinary } from '@cloudinary/url-gen';
import { cssBundleHref } from '@remix-run/css-bundle';
import { json } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import { useMemo } from 'react';
import { Toaster } from 'sonner';

import customStylesUrl from '~/custom.css';
import { getUser } from '~/session.server';
import stylesheet from '~/tailwind.css';

import { CloudinaryContextProvider } from './components/CloudinaryContextProvider';
import { Env } from './models/environment';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'stylesheet', href: customStylesUrl },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;600;700&display=swap',
  },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);

  const CLOUD_NAME = Env.CLOUDINARY_CLOUD_NAME;
  const UPLOAD_RESET = Env.CLOUDINARY_UPLOAD_RESET;

  return json({ user, CLOUD_NAME, UPLOAD_RESET });
};

export default function App() {
  const { user, CLOUD_NAME, UPLOAD_RESET } = useLoaderData<typeof loader>();
  console.log('current user', user?.emailAddress);

  const CloudinaryUtil = useMemo(() => {
    return new Cloudinary({ cloud: { cloudName: CLOUD_NAME } });
  }, [CLOUD_NAME]);

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <style></style>
      <body className="h-full">
        <CloudinaryContextProvider
          CLOUDINARY_CLOUD_NAME={CLOUD_NAME}
          CLOUDINARY_UPLOAD_RESET={UPLOAD_RESET}
          CloudinaryUtil={CloudinaryUtil}
        >
          <Outlet />
          <Toaster />
        </CloudinaryContextProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
