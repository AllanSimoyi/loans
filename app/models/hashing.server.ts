import bcrypt from 'bcryptjs';

export function createPasswordHash(password: string) {
  return bcrypt.hash(password.trim(), 10);
}

export function checkIfPasswordValid(
  inputPassword: string,
  hashedPassword: string,
) {
  return bcrypt.compare(inputPassword, hashedPassword);
}
