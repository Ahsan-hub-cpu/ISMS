import type { Permission } from "./permissions";

export interface RoleSummary {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly isSystem: boolean;
}

export interface Role extends RoleSummary {
  readonly permissions: readonly Permission[];
  readonly userCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly jobTitle: string | null;
  readonly roleId: string;
  readonly roleCode: string;
  readonly roleName: string;
  readonly permissions: readonly Permission[];
  readonly isActive: boolean;
  readonly siteId: string | null;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
}

/** A user together with the secret needed to verify a sign-in attempt. */
export interface UserWithCredentials extends User {
  readonly passwordHash: string;
}

/** The subset of user data carried in the session cookie / JWT. */
export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roleId: string;
  readonly roleCode: string;
  readonly roleName: string;
  readonly permissions: readonly Permission[];
}

export const toSessionUser = (user: User): SessionUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  roleId: user.roleId,
  roleCode: user.roleCode,
  roleName: user.roleName,
  permissions: user.permissions,
});

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const initialsOf = (fullName: string): string =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** Stable slug used as Role.code for custom roles. */
export const slugifyRoleCode = (name: string): string =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "ROLE";
