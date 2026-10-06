import type { AuditDraft } from "@/modules/audit";
import { NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { Role } from "../../domain/user";
import type { RoleRepository } from "../ports/role-repository";
import type { UpdateRoleInput } from "../schemas";

interface Dependencies {
  readonly roles: RoleRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly roleId: string;
  readonly changes: UpdateRoleInput;
}

export const updateRole =
  ({ roles, audit }: Dependencies) =>
  async ({ actor, roleId, changes }: Command): Promise<Result<Role>> => {
    const existing = await roles.findById(roleId);
    if (!existing) {
      return failure(new NotFoundError("Role", roleId));
    }

    const updated = await roles.update(roleId, {
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.description !== undefined ? { description: changes.description } : {}),
      ...(changes.permissions !== undefined ? { permissions: changes.permissions } : {}),
    });

    await audit({
      actor,
      action: "UPDATE",
      entityType: "Role",
      entityId: updated.id,
      summary: `Role ${updated.name} updated (${updated.permissions.length} permissions)`,
    });

    return success(updated);
  };
