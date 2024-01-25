export const AppLinks = {
  Home: '/',
  CreateAccount: '/join',
  Login: '/login',
  Logout: '/logout',

  MyAccount: '/my-account',
  ChangePassword: '/change-password',

  Lenders: '/lenders',
  AddLender: '/lenders/add',
  Lender: (id: number) => `/lenders/${id}`,
  EditLender: (id: number) => `/lenders/${id}/edit`,
  ChangeLenderPassword: (id: number) => `/lenders/${id}/change-password`,
  LenderEmploymentTypes: (id: number) => `/lenders/${id}/employment-types`,

  Admins: '/admins',
  AddAdmin: '/admins/add',
  EditAdmin: (id: number) => `/admins/${id}/edit`,
  ChangeAdminPassword: (id: number) => `/admins/${id}/change-password`,

  Applications: '/applications',
  Apply: '/apply',
  Application: (id: number) => `/applications/${id}`,
  ApplicationLenders: (id: number) => `/applications/${id}/lenders`,
  EditApplication: (id: number) => `/applications/${id}/edit`,

  EmploymentTypes: '/employment-types',
  EditEmploymentType: (id: number) => `/employment-types/${id}/edit`,
  AddEmploymentType: '/employment-types/add',
} as const;
