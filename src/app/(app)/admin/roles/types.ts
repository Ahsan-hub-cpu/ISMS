import type { Permission } from "@/modules/auth/domain/permissions";

/** Serializable role row for the admin Roles screen. */
export interface RoleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  userCount: number;
}
