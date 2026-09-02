import { ConflictError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { User } from "../../domain/user";
import type { PasswordHasher } from "../ports/password-hasher";
import type { UserRepository } from "../ports/user-repository";
import type { CreateUserInput } from "../schemas";

interface Dependencies {
  readonly users: UserRepository;
  readonly hasher: PasswordHasher;
}

export const createUser =
  ({ users, hasher }: Dependencies) =>
  async (input: CreateUserInput): Promise<Result<User>> => {
    if (await users.existsByEmail(input.email)) {
      return failure(new ConflictError(`An account already exists for ${input.email}.`));
    }

    const created = await users.create({
      email: input.email,
      fullName: input.fullName,
      jobTitle: input.jobTitle ?? null,
      passwordHash: await hasher.hash(input.password),
      role: input.role,
      siteId: input.siteId ?? null,
    });

    return success(created);
  };
