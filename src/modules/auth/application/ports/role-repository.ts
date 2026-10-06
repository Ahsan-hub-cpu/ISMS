import type { Permission } from "../../domain/permissions";
import type { Role, RoleSummary } from "../../domain/user";

export interface NewRole {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly permissions: readonly Permission[];
}

export interface RoleUpdates {
  readonly name?: string;
  readonly description?: string | null;
  readonly permissions?: readonly Permission[];
}

export interface RoleRepository {
  list(): Promise<Role[]>;
  listSummaries(): Promise<RoleSummary[]>;
  findById(id: string): Promise<Role | null>;
  findByCode(code: string): Promise<Role | null>;
  create(data: NewRole): Promise<Role>;
  update(id: string, data: RoleUpdates): Promise<Role>;
  delete(id: string): Promise<void>;
  countUsers(roleId: string): Promise<number>;
}
