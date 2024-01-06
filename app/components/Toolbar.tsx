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
    <div className="flex flex-col items-stretch bg-white shadow-md">
      {showProgressBar && (
        <div className="flex flex-col items-stretch py-0">
          <ProgressBar />
        </div>
      )}
      <CenteredView>
        <div className="flex flex-row p-4 justify-center items-center">
          <div className="flex flex-row items-end gap-4">
            <Link to={AppLinks.Home}>
              <Logo small />
            </Link>
            <UnderLineOnHover>
              <Link to={AppLinks.Home}>
                <h1 className="text-indigo-600 text-2xl font-normal">
                  ZIM LOANS ONLINE
                </h1>
              </Link>
            </UnderLineOnHover>
          </div>
          <div className="grow" />
          {!currentUser && (
            <div className="hidden md:flex flex-row items-stretch gap-6">
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
          <div className="flex flex-row items-center p-0 justify-end">
            {!!currentUser && (
              <span className="text-md px-4 text-nowrap">
                {currentUser.fullName}
              </span>
            )}
            <DropDownMenu
              className="md:hidden"
              isLoggedIn={!!currentUser}
              kind={currentUser?.kind || ''}
            />
          </div>
        </div>
      </CenteredView>
    </div>
  );
}
