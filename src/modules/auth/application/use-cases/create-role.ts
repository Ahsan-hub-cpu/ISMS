import type { AuditDraft } from "@/modules/audit";
import { ConflictError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import { slugifyRoleCode, type Role } from "../../domain/user";
import type { RoleRepository } from "../ports/role-repository";
import type { CreateRoleInput } from "../schemas";

interface Dependencies {
  readonly roles: RoleRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly input: CreateRoleInput;
}

export const createRole =
  ({ roles, audit }: Dependencies) =>
  async ({ actor, input }: Command): Promise<Result<Role>> => {
    let code = slugifyRoleCode(input.name);
    if (await roles.findByCode(code)) {
      code = `${code}_${Date.now().toString(36).toUpperCase()}`.slice(0, 64);
    }

    if (await roles.findByCode(code)) {
      return failure(new ConflictError("A role with a similar name already exists."));
    }

    const created = await roles.create({
      code,
      name: input.name,
      description: input.description ?? null,
      isSystem: false,
      permissions: input.permissions,
    });

    await audit({
      actor,
      action: "CREATE",
      entityType: "Role",
      entityId: created.id,
      summary: `Role ${created.name} created with ${created.permissions.length} permissions`,
    });

    return success(created);
  };
