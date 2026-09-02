import { createUser } from "./application/use-cases/create-user";
import { listUsers } from "./application/use-cases/list-users";
import { signIn } from "./application/use-cases/sign-in";
import { updateUser } from "./application/use-cases/update-user";
import { bcryptPasswordHasher } from "./infrastructure/bcrypt-password-hasher";
import { prismaUserRepository } from "./infrastructure/prisma-user-repository";

const dependencies = {
  users: prismaUserRepository,
  hasher: bcryptPasswordHasher,
};

/** Composition root for the auth module. */
export const authService = {
  signIn: signIn(dependencies),
  listUsers: listUsers(prismaUserRepository),
  createUser: createUser(dependencies),
  updateUser: updateUser(dependencies),
  findById: (id: string) => prismaUserRepository.findById(id),
};

export type { SessionUser, User, UserRole } from "./domain/user";
export type { Permission } from "./domain/permissions";
