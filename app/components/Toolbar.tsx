import { Link, useNavigation } from '@remix-run/react';

import { AppLinks } from '~/models/links';

import { CenteredView } from './CenteredView';
import { DropDownMenu } from './DropDownMenu';
import { GhostButtonLink } from './GhostButton';
import { Logo } from './Logo';
import { ProgressBar } from './ProgressBar';
import { UnderLineOnHover } from './UnderLineOnHover';

interface NavItem {
  text: string;
  href: string;
  primary?: boolean;
}

const navItems: NavItem[] = [
  { text: 'Create Account', href: '/', primary: true },
  { text: 'Log In', href: '/login' },
];

interface Props {
  currentUser: { fullName: string; kind: string } | undefined;
  showProgressBar?: boolean;
}

export function Toolbar(props: Props) {
  const { showProgressBar: initShowProgressBar, currentUser } = props;
  const nav = useNavigation();

  const showProgressBar = initShowProgressBar || nav.state !== 'idle';

  return (
    <div className="flex flex-col items-stretch bg-white shadow-md print:shadow-none">
      {showProgressBar && (
        <div className="flex flex-col items-stretch py-0">
          <ProgressBar />
        </div>
      )}
      <CenteredView>
        <div className="flex flex-row items-center justify-center p-4">
          <div className="flex flex-row items-end gap-4">
            <Link to={AppLinks.Home}>
              <Logo small />
            </Link>
            <UnderLineOnHover className="hidden sm:flex">
              <Link to={AppLinks.Home}>
                <h1 className="text-2xl font-normal text-blue-600">
                  QUICK LOANS
                </h1>
              </Link>
            </UnderLineOnHover>
          </div>
          <div className="grow" />
          {!currentUser && (
            <div className="hidden flex-row items-stretch gap-4 md:flex">
              {navItems.map((item) => (
                <GhostButtonLink
                  key={item.text}
                  to={item.href}
                  prefetch="intent"
                >
                  {item.text}
                </GhostButtonLink>
              ))}
            </div>
          )}
          <div className="flex flex-row items-center justify-end p-0 pl-6 print:hidden">
            {!!currentUser && (
              <span className="hidden text-nowrap px-4 font-light md:flex">
                {currentUser.fullName}
              </span>
            )}
            <DropDownMenu
              isLoggedIn={!!currentUser}
              kind={currentUser?.kind || ''}
            />
          </div>
        </div>
      </CenteredView>
    </div>
  );
}
