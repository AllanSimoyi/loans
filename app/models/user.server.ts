import type {
  CreateAccountSchema,
  CreateAdminSchema,
} from './auth.validations';
import type { User } from '@prisma/client';
import type { z } from 'zod';

import bcrypt from 'bcryptjs';

import { prisma } from '~/db.server';

import { ADMIN, APPLICANT, LENDER } from './auth.validations';

export type { User } from '@prisma/client';

export async function getUserById(id: User['id']) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(emailAddress: User['emailAddress']) {
  return prisma.user.findFirst({ where: { emailAddress } });
}

type CreateUserProps = Pick<User, 'emailAddress' | 'fullName' | 'kind'> & {
  password: string;
};

export async function createUser(props: CreateUserProps) {
  const { emailAddress, password, fullName, kind } = props;
  return prisma.user.create({
    data: {
      emailAddress: emailAddress.toLowerCase().trim(),
      hashedPassword: await bcrypt.hash(password.trim(), 10),
      fullName,
      kind,
    },
  });
}

export async function createLenderUser(
  input: z.infer<typeof CreateAccountSchema>,
) {
  const duplicates = await prisma.user.findMany({
    where: { emailAddress: input.emailAddress.toLowerCase().trim() },
  });
  if (duplicates.length) {
    throw new Error('Email address already used');
  }
  const createdLender = await createUser({ ...input, kind: LENDER });
  const { hashedPassword, ...rest } = createdLender;
  (() => hashedPassword)(); // appease linter
  return rest;
}

export async function createAdminUser(
  input: z.infer<typeof CreateAdminSchema>,
) {
  const duplicates = await prisma.user.findMany({
    where: { emailAddress: input.emailAddress.toLowerCase().trim() },
  });
  if (duplicates.length) {
    throw new Error('Email address already used');
  }
  const createdLender = await createUser({ ...input, kind: ADMIN });
  const { hashedPassword, ...rest } = createdLender;
  (() => hashedPassword)(); // appease linter
  return rest;
}

export async function createApplicant(
  input: z.infer<typeof CreateAccountSchema>,
) {
  const duplicates = await prisma.user.findMany({
    where: { emailAddress: input.emailAddress.toLowerCase().trim() },
  });
  if (duplicates.length) {
    throw new Error('Email address already used');
  }
  const createdApplicant = await createUser({ ...input, kind: APPLICANT });
  const { hashedPassword, ...rest } = createdApplicant;
  (() => hashedPassword)(); // appease linter
  return rest;
}

export async function deleteUserByEmail(emailAddress: User['emailAddress']) {
  return prisma.user.delete({ where: { emailAddress } });
}

export async function verifyLogin(
  emailAddress: User['emailAddress'],
  password: string,
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { emailAddress },
  });
  if (!userWithPassword || !userWithPassword.hashedPassword) {
    return null;
  }
  const isValid = await bcrypt.compare(
    password,
    userWithPassword.hashedPassword,
  );
  if (!isValid) {
    return null;
  }
  const { hashedPassword, ...userWithoutPassword } = userWithPassword;
  (() => hashedPassword)(); // appease linter
  return userWithoutPassword;
}
