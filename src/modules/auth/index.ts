import { auditService } from "@/modules/audit";

import { createRole } from "./application/use-cases/create-role";
import { createUser } from "./application/use-cases/create-user";
import { deleteRole } from "./application/use-cases/delete-role";
import { listUsers } from "./application/use-cases/list-users";
import { signIn } from "./application/use-cases/sign-in";
import { updateRole } from "./application/use-cases/update-role";
import { updateUser } from "./application/use-cases/update-user";
import { bcryptPasswordHasher } from "./infrastructure/bcrypt-password-hasher";
import { prismaRoleRepository } from "./infrastructure/prisma-role-repository";
import { prismaUserRepository } from "./infrastructure/prisma-user-repository";

const userDependencies = {
  users: prismaUserRepository,
  roles: prismaRoleRepository,
  hasher: bcryptPasswordHasher,
};

const roleDependencies = {
  roles: prismaRoleRepository,
  audit: auditService.record,
};

/** Composition root for the auth module. */
export const authService = {
  signIn: signIn({ users: prismaUserRepository, hasher: bcryptPasswordHasher }),
  listUsers: listUsers(prismaUserRepository),
  createUser: createUser(userDependencies),
  updateUser: updateUser(userDependencies),
  findById: (id: string) => prismaUserRepository.findById(id),

  listRoles: () => prismaRoleRepository.list(),
  listRoleSummaries: () => prismaRoleRepository.listSummaries(),
  findRoleById: (id: string) => prismaRoleRepository.findById(id),
  createRole: createRole(roleDependencies),
  updateRole: updateRole(roleDependencies),
  deleteRole: deleteRole(roleDependencies),
};

export type { SessionUser, User, Role, RoleSummary } from "./domain/user";
export type { Permission, PermissionGroup } from "./domain/permissions";
export {
  PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  can,
  canAny,
} from "./domain/permissions";
