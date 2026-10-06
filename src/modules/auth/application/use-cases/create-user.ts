import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { User } from "../../domain/user";
import type { PasswordHasher } from "../ports/password-hasher";
import type { RoleRepository } from "../ports/role-repository";
import type { UserRepository } from "../ports/user-repository";
import type { CreateUserInput } from "../schemas";

interface Dependencies {
  readonly users: UserRepository;
  readonly roles: RoleRepository;
  readonly hasher: PasswordHasher;
}

export const createUser =
  ({ users, roles, hasher }: Dependencies) =>
  async (input: CreateUserInput): Promise<Result<User>> => {
    if (await users.existsByEmail(input.email)) {
      return failure(new ConflictError(`An account already exists for ${input.email}.`));
    }

    const role = await roles.findById(input.roleId);
    if (!role) {
      return failure(new NotFoundError("Role", input.roleId));
    }

    const created = await users.create({
      email: input.email,
      fullName: input.fullName,
      jobTitle: input.jobTitle ?? null,
      passwordHash: await hasher.hash(input.password),
      roleId: role.id,
      siteId: input.siteId ?? null,
    });

    return success(created);
  };
