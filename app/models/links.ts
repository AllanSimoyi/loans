export const AppLinks = {
  Home: '/',
  CreateAccount: '/join',
  Login: '/login',
  Logout: '/logout',

  MyAccount: '/my-account',
  ChangePassword: '/change-password',

  AddLender: '/lenders/add',
  Lender: (id: number) => `/lenders/${id}`,
  EditLender: (id: number) => `/lenders/${id}/edit`,
  ChangeLenderPassword: (id: number) => `/lenders/${id}/change-password`,
  LenderEmploymentTypes: (id: number) => `/lenders/${id}/employment-types`,

  Apply: '/apply',
  Applications: '/applications',
  Application: (id: number) => `/applications/${id}`,
  ApplicationLenders: (id: number) => `/applications/${id}/lenders`,
  EditApplication: (id: number) => `/applications/${id}/edit`,

  Lenders: '/lenders',
  Admins: '/admins',
  Employment: '/employment',
} as const;
