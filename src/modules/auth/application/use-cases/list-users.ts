import { success, type Result } from "@/shared/core/result";

import type { User } from "../../domain/user";
import type { UserRepository } from "../ports/user-repository";

export const listUsers =
  (users: UserRepository) =>
  async (): Promise<Result<readonly User[]>> =>
    success(await users.list());
