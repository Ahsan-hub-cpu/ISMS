import type { RoleSummary } from "@/modules/auth/domain/user";

/** View model passed to client components: only serialisable values. */
export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  roleId: string;
  roleName: string;
  isActive: boolean;
  siteId: string | null;
  lastLoginAt: string | null;
}

export interface SiteOption {
  id: string;
  name: string;
}

export type RoleOption = Pick<RoleSummary, "id" | "code" | "name" | "description">;
