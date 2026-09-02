import "server-only";

import bcrypt from "bcryptjs";

import type { PasswordHasher } from "../application/ports/password-hasher";

const SALT_ROUNDS = 12;

export const bcryptPasswordHasher: PasswordHasher = {
  hash: (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS),
  verify: (plainPassword, passwordHash) => bcrypt.compare(plainPassword, passwordHash),
};
