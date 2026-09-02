import type { UserRole } from "./user";

/**
 * Permissions are the single vocabulary the whole application uses to decide
 * "may this person do that?". Screens and API routes check a permission,
 * never a role, so the role matrix can change without touching feature code.
 */
export const PERMISSIONS = [
  "users:read",
  "users:manage",
  "frameworks:read",
  "frameworks:manage",
  "register:read",
  "register:manage",
  "assessments:read",
  "assessments:conduct",
  "assessments:approve",
  "gaps:read",
  "gaps:manage",
  "evidence:read",
  "evidence:upload",
  "evidence:review",
  "remediation:read",
  "remediation:update",
  "remediation:manage",
  "reports:read",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const READ_ONLY: Permission[] = [
  "frameworks:read",
  "register:read",
  "assessments:read",
  "gaps:read",
  "evidence:read",
  "remediation:read",
  "reports:read",
];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMINISTRATOR: PERMISSIONS,

  ASSESSOR: [
    ...READ_ONLY,
    "users:read",
    "register:manage",
    "assessments:conduct",
    "assessments:approve",
    "gaps:manage",
    "evidence:upload",
    "evidence:review",
    // Raising an action implies being able to move it on, so `manage` carries
    // `update` with it rather than leaving assessors unable to edit their own plan.
    "remediation:update",
    "remediation:manage",
    "audit:read",
  ],

  CONTROL_OWNER: [...READ_ONLY, "evidence:upload", "remediation:update"],

  VIEWER: READ_ONLY,
};

export const permissionsFor = (role: UserRole): readonly Permission[] => ROLE_PERMISSIONS[role];

export const can = (role: UserRole, permission: Permission): boolean =>
  ROLE_PERMISSIONS[role].includes(permission);

export const canAny = (role: UserRole, permissions: readonly Permission[]): boolean =>
  permissions.some((permission) => can(role, permission));
