import type { UserRole } from "@/modules/auth/domain/user";

/** View model passed to client components: only serialisable values. */
export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  jobTitle: string | null;
  role: UserRole;
  isActive: boolean;
  siteId: string | null;
  lastLoginAt: string | null;
}

export interface SiteOption {
  id: string;
  name: string;
}
