import type { AuditDraft } from "@/modules/audit";
import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { RoleRepository } from "../ports/role-repository";

interface Dependencies {
  readonly roles: RoleRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly roleId: string;
}

export const deleteRole =
  ({ roles, audit }: Dependencies) =>
  async ({ actor, roleId }: Command): Promise<Result<{ id: string }>> => {
    const existing = await roles.findById(roleId);
    if (!existing) {
      return failure(new NotFoundError("Role", roleId));
    }

    if (existing.isSystem) {
      return failure(new ConflictError("System roles cannot be deleted."));
    }

    if (existing.userCount > 0) {
      return failure(
        new ConflictError(
          existing.userCount === 1
            ? "Reassign the 1 user on this role before deleting it."
            : `Reassign the ${existing.userCount} users on this role before deleting it.`,
        ),
      );
    }

    await roles.delete(roleId);

    await audit({
      actor,
      action: "DELETE",
      entityType: "Role",
      entityId: roleId,
      summary: `Role ${existing.name} deleted`,
    });

    return success({ id: roleId });
  };
