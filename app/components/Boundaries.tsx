import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from '@remix-run/react';
import { useCallback } from 'react';
import { AlertTriangle } from 'tabler-icons-react';

import { getErrorMessage } from '~/models/errors';
import { AppLinks } from '~/models/links';

import { SecondaryButton, SecondaryButtonLink } from './SecondaryButton';

interface BoundaryErrorProps {
  title: string;
  children: React.ReactNode;
}

function ContactSupport({ preFilledMessage }: { preFilledMessage: string }) {
  return (
    <a
      className="text-white underline"
      href={`mailto:allansimoyi@gmail.com?subject=I've encountered a problem&body=${preFilledMessage}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      contact me via email
    </a>
  );
}

function createPrefilledMessage(message: string) {
  return encodeURIComponent(`I've encountered the following error: ${message}`);
}

function BoundaryError(props: BoundaryErrorProps) {
  const { title, children } = props;
  return (
    <div className="flex flex-col items-stretch justify-center space-y-6 rounded-md bg-white/10 p-6">
      <div className="flex flex-col items-center justify-center space-y-4">
        <AlertTriangle size={40} color="red" />
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
      </div>
      <div className="flex flex-col items-stretch justify-center space-y-6 text-center">
        {children}
      </div>
    </div>
  );
}
interface RouterCatchBoundaryProps {
  error: {
    status: number;
    data: unknown;
    statusText: string;
  };
}
function RouteCatchBoundary(props: RouterCatchBoundaryProps) {
  const { error } = props;

  const navigate = useNavigate();

  const reload = useCallback(() => {
    navigate('.', { replace: true });
  }, [navigate]);

  const errorMessage =
    typeof error.data === 'string' ? error.data : error.statusText;

  switch (error.status) {
    case 400: {
      return (
        <BoundaryError title="Error 400 - Bad Request">
          {errorMessage ? (
            <span className="text-center text-white/50">`{errorMessage}`</span>
          ) : null}
          <span className="text-center leading-8 text-white/50">
            We received a malformed or invalid request. <br />
            Please review your input and ensure it is valid. <br />
            If the issue persists,&nbsp;
            <ContactSupport
              preFilledMessage={createPrefilledMessage(
                errorMessage || 'Error 400 - Bad Request',
              )}
            />
          </span>
          <SecondaryButton onClick={reload}>Reload</SecondaryButton>
        </BoundaryError>
      );
    }
    case 401: {
      return (
        <BoundaryError title="Error 401 - Unauthorised">
          {errorMessage ? (
            <span className="text-center text-white/50">`{errorMessage}`</span>
          ) : null}
          <span className="text-center leading-8 text-white/50">
            You are not authorised to access this resource. <br />
            Please ensure you are logged in before requesting for this resource.{' '}
            <br />
            If the issue persists,&nbsp;
            <ContactSupport
              preFilledMessage={createPrefilledMessage(
                errorMessage || 'Error 401 - Unauthorised',
              )}
            />
          </span>
          <SecondaryButtonLink to={AppLinks.Login}>
            Open Login Page
          </SecondaryButtonLink>
        </BoundaryError>
      );
    }
    case 403: {
      return (
        <BoundaryError title="Error 403 - Forbidden">
          {errorMessage ? (
            <span className="text-center text-white/50">`{errorMessage}`</span>
          ) : null}
          <span className="text-center leading-8 text-white/50">
            {"You don't have permission to access this resource."} <br />
            If the issue persists,&nbsp;
            <ContactSupport
              preFilledMessage={createPrefilledMessage(
                errorMessage || 'Error 403 - Forbidden',
              )}
            />
          </span>
          <SecondaryButtonLink to={AppLinks.Login}>
            Open Login Page
          </SecondaryButtonLink>
        </BoundaryError>
      );
    }
    case 404: {
      return (
        <BoundaryError title="Error 404 - Resource Not Found">
          <div className="flex flex-col items-stretch justify-start space-y-4 px-6">
            {errorMessage ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-center text-white/50">
                  `{errorMessage}`
                </span>
              </div>
            ) : null}
            <div className="flex flex-col items-stretch space-y-2 pb-6 text-white/50">
              <div className="flex flex-col items-center justify-center">
                <span className="text-center">
                  {"We couldn't find that resource."} <br />
                </span>
              </div>
              <div className="flex flex-col items-start justify-start space-y-4 py-2">
                <span className="text-base">
                  {"This could've been because of any of the following:"}
                </span>
                <ul className="list-disc text-start">
                  <li>The resource has moved.</li>
                  <li>The resource no longer exists.</li>
                  <li>
                    You entered a slighly wrong URL, try checking for typos.
                  </li>
                </ul>
              </div>
              <span className="text-start">
                Please review the resource address and try again. <br />
                If the issue persists,&nbsp;
                <ContactSupport
                  preFilledMessage={createPrefilledMessage(
                    errorMessage || 'Error 404 - Resource Not Found',
                  )}
                />
              </span>
            </div>
          </div>
        </BoundaryError>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${error.status}, ${error.statusText}`);
    }
  }
}
export function ErrorBoundary() {
  const navigate = useNavigate();
  const error = useRouteError();

  const reload = useCallback(() => {
    navigate('.', { replace: true });
  }, [navigate]);

  const errorMessage =
    getErrorMessage(error) || 'Something went wrong, please reload the page';

  console.log('error', error);

  if (isRouteErrorResponse(error)) {
    return <RouteCatchBoundary error={error} />;
  }

  return (
    <BoundaryError title="Error 500 - Internal Server Error">
      <span className="text-center leading-8 text-white/50">
        We encountered an unexpected error. <br />
        We are already working on fixing it. <br />
      </span>
      {errorMessage ? (
        <span className="text-center font-bold text-white/50">
          `{errorMessage}` <br />
        </span>
      ) : null}
      <span className="text-center leading-8 text-white/50">
        Please try reloading the page. <br />
        If the issue persists,&nbsp;
        <ContactSupport
          preFilledMessage={createPrefilledMessage(errorMessage)}
        />
      </span>
      <SecondaryButton onClick={reload}>Reload</SecondaryButton>
    </BoundaryError>
  );
}
export function RouteErrorBoundary() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex max-w-screen-md flex-col items-stretch p-6">
        <ErrorBoundary />
      </div>
    </div>
  );
}
