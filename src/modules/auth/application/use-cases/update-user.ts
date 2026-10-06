import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { User } from "../../domain/user";
import type { RoleRepository } from "../ports/role-repository";
import type { UserRepository } from "../ports/user-repository";
import type { UpdateUserInput } from "../schemas";

interface Dependencies {
  readonly users: UserRepository;
  readonly roles: RoleRepository;
}

interface Command {
  readonly actorId: string;
  readonly targetUserId: string;
  readonly changes: UpdateUserInput;
}

export const updateUser =
  ({ users, roles }: Dependencies) =>
  async ({ actorId, targetUserId, changes }: Command): Promise<Result<User>> => {
    const target = await users.findById(targetUserId);
    if (!target) {
      return failure(new NotFoundError("User", targetUserId));
    }

    if (changes.roleId) {
      const role = await roles.findById(changes.roleId);
      if (!role) {
        return failure(new NotFoundError("Role", changes.roleId));
      }
    }

    const nextRole =
      changes.roleId && changes.roleId !== target.roleId
        ? await roles.findById(changes.roleId)
        : null;

    const losesAdminRights =
      target.roleCode === "ADMINISTRATOR" &&
      ((nextRole !== null && nextRole.code !== "ADMINISTRATOR") || changes.isActive === false);

    // Administrators must not be able to lock themselves out of the system.
    if (losesAdminRights && actorId === targetUserId) {
      return failure(new ConflictError("You cannot remove your own administrator access."));
    }

    if (losesAdminRights && target.isActive) {
      const adminRole = await roles.findByCode("ADMINISTRATOR");
      if (adminRole) {
        const activeAdmins = await users.countByRoleId(adminRole.id, { activeOnly: true });
        if (activeAdmins <= 1) {
          return failure(new ConflictError("At least one active administrator must remain."));
        }
      }
    }

    return success(
      await users.update(targetUserId, {
        ...(changes.fullName !== undefined ? { fullName: changes.fullName } : {}),
        ...(changes.jobTitle !== undefined ? { jobTitle: changes.jobTitle } : {}),
        ...(changes.roleId !== undefined ? { roleId: changes.roleId } : {}),
        ...(changes.isActive !== undefined ? { isActive: changes.isActive } : {}),
        ...(changes.siteId !== undefined ? { siteId: changes.siteId } : {}),
      }),
    );
  };
