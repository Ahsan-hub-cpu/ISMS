import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { User } from "../../domain/user";
import type { UserRepository } from "../ports/user-repository";
import type { UpdateUserInput } from "../schemas";

interface Dependencies {
  readonly users: UserRepository;
}

interface Command {
  readonly actorId: string;
  readonly targetUserId: string;
  readonly changes: UpdateUserInput;
}

export const updateUser =
  ({ users }: Dependencies) =>
  async ({ actorId, targetUserId, changes }: Command): Promise<Result<User>> => {
    const target = await users.findById(targetUserId);
    if (!target) {
      return failure(new NotFoundError("User", targetUserId));
    }

    const losesAdminRights =
      target.role === "ADMINISTRATOR" &&
      ((changes.role !== undefined && changes.role !== "ADMINISTRATOR") ||
        changes.isActive === false);

    // Administrators must not be able to lock themselves out of the system.
    if (losesAdminRights && actorId === targetUserId) {
      return failure(new ConflictError("You cannot remove your own administrator access."));
    }

    if (losesAdminRights && target.isActive) {
      const activeAdmins = await users.countByRole("ADMINISTRATOR", { activeOnly: true });
      if (activeAdmins <= 1) {
        return failure(new ConflictError("At least one active administrator must remain."));
      }
    }

    return success(await users.update(targetUserId, changes));
  };
