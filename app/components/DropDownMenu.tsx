import type { ComponentProps } from 'react';
import type { Icon } from 'tabler-icons-react';

import { Menu, Transition } from '@headlessui/react';
import { Form } from '@remix-run/react';
import { Fragment, useMemo } from 'react';
import {
  Archive,
  Briefcase,
  BuildingBank,
  DotsVertical,
  Login,
  ShieldLock,
  User,
} from 'tabler-icons-react';
import { twMerge } from 'tailwind-merge';

import { UserType } from '~/models/auth.validations';
import { AppLinks } from '~/models/links';

import { ToolbarMenuItem } from './ToolbarMenuItem';

interface Props extends ComponentProps<'div'> {
  isLoggedIn: boolean;
  kind: string;
}

const ADMIN_LINKS: [string, string, Icon][] = [
  [AppLinks.MyAccount, 'My Account', User],
  [AppLinks.Applications, 'Applications', Archive],
  [AppLinks.Lenders, 'Lenders', BuildingBank],
  [AppLinks.Admins, 'Admins', ShieldLock],
  [AppLinks.Employment, 'Employment', Briefcase],
] as const;
const LENDER_LINKS: [string, string, Icon][] = [
  [AppLinks.MyAccount, 'My Account', User],
  [AppLinks.Applications, 'Applications', Archive],
] as const;
const APPLICANT_LINKS: [string, string, Icon][] = [
  [AppLinks.MyAccount, 'My Account', User],
  [AppLinks.Applications, 'Applications', Archive],
] as const;
const IS_NOT_LOGGED_IN: [string, string, Icon][] = [
  [AppLinks.Login, 'Login', Login],
  [AppLinks.Login, 'Create Account', User],
] as const;

export function DropDownMenu(props: Props) {
  const { isLoggedIn, kind, className, ...restOfProps } = props;

  const menuItems = useMemo(() => {
    if (!isLoggedIn) {
      return IS_NOT_LOGGED_IN;
    }
    if (kind === UserType.Admin) {
      return ADMIN_LINKS;
    }
    if (kind === UserType.Lender) {
      return LENDER_LINKS;
    }
    return APPLICANT_LINKS;
  }, [kind, isLoggedIn]);

  const children = useMemo(() => {
    const itemChildren = menuItems.map(([link, caption, icon]) => {
      return function child(active: boolean) {
        return (
          <ToolbarMenuItem mode="link" active={active} to={link}>
            {caption}
          </ToolbarMenuItem>
        );
      };
    });
    if (!isLoggedIn) {
      return itemChildren;
    }
    return [
      ...itemChildren,
      function child(active: boolean) {
        return (
          <Form action={AppLinks.Logout} method="post">
            <ToolbarMenuItem mode="button" active={active} type="submit">
              Log Out
            </ToolbarMenuItem>
          </Form>
        );
      },
    ];
  }, [isLoggedIn, menuItems]);

  return (
    <div className={twMerge('relative', className)} {...restOfProps}>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button
            type="button"
            className="rounded p-2 transition-all duration-300 hover:bg-stone-100"
          >
            <DotsVertical
              data-testid="menu"
              size={20}
              className="text-blue-600"
            />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-stone-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1">
              {children.map((child, index) => (
                <Menu.Item key={index}>
                  {({ active }) => child(active)}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
