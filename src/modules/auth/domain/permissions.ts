/**
 * Permissions are the single vocabulary the whole application uses to decide
 * "may this person do that?". Screens and API routes check a permission,
 * never a role name, so the role matrix can change without touching feature code.
 */
export const PERMISSIONS = [
  "users:read",
  "users:manage",
  "organization:manage",
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

export const PERMISSION_LABELS: Record<Permission, string> = {
  "users:read": "View users",
  "users:manage": "Manage users & roles",
  "organization:manage": "Manage sites",
  "frameworks:read": "View frameworks",
  "frameworks:manage": "Manage frameworks",
  "register:read": "View control register",
  "register:manage": "Edit control register",
  "assessments:read": "View assessments",
  "assessments:conduct": "Conduct assessments",
  "assessments:approve": "Approve assessments",
  "gaps:read": "View gaps",
  "gaps:manage": "Manage & close gaps",
  "evidence:read": "View evidence",
  "evidence:upload": "Upload evidence",
  "evidence:review": "Accept / reject evidence",
  "remediation:read": "View remediation",
  "remediation:update": "Update remediation progress",
  "remediation:manage": "Plan remediation actions",
  "reports:read": "View reports",
  "audit:read": "View audit log",
};

export interface PermissionGroup {
  readonly title: string;
  readonly permissions: readonly Permission[];
}

/** Grouped for the role editor so admins are not faced with a flat checklist. */
export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    title: "Administration",
    permissions: ["users:read", "users:manage", "organization:manage", "audit:read"],
  },
  {
    title: "Catalogue & register",
    permissions: ["frameworks:read", "frameworks:manage", "register:read", "register:manage"],
  },
  {
    title: "Assessments & gaps",
    permissions: [
      "assessments:read",
      "assessments:conduct",
      "assessments:approve",
      "gaps:read",
      "gaps:manage",
    ],
  },
  {
    title: "Evidence & remediation",
    permissions: [
      "evidence:read",
      "evidence:upload",
      "evidence:review",
      "remediation:read",
      "remediation:update",
      "remediation:manage",
    ],
  },
  {
    title: "Reporting",
    permissions: ["reports:read"],
  },
];

/**
 * Seed defaults for the four system roles (also applied by SQL migrations).
 * Separation of duties: Assessor conducts/submits; Approver stamps; Owner fixes.
 * Administrator retains every permission as break-glass access.
 */
export const SYSTEM_ROLE_PERMISSIONS = {
  ADMINISTRATOR: PERMISSIONS,
  ASSESSOR: [
    "frameworks:read",
    "register:read",
    "register:manage",
    "assessments:read",
    "assessments:conduct",
    "gaps:read",
    "gaps:manage",
    "evidence:read",
    "evidence:upload",
    "evidence:review",
    "remediation:read",
    "remediation:update",
    "remediation:manage",
    "reports:read",
    "users:read",
    "audit:read",
  ],
  APPROVER: [
    "frameworks:read",
    "register:read",
    "assessments:read",
    "assessments:approve",
    "gaps:read",
    "gaps:manage",
    "evidence:read",
    "evidence:review",
    "remediation:read",
    "reports:read",
    "audit:read",
  ],
  CONTROL_OWNER: [
    "frameworks:read",
    "register:read",
    "assessments:read",
    "gaps:read",
    "evidence:read",
    "evidence:upload",
    "remediation:read",
    "remediation:update",
    "reports:read",
  ],
} as const satisfies Record<string, readonly Permission[]>;

export const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

/** Synchronous check against the permissions carried on the session. */
export const can = (
  holder: { readonly permissions: readonly Permission[] } | readonly Permission[],
  permission: Permission,
): boolean => {
  const list = "permissions" in holder ? holder.permissions : holder;
  return list.includes(permission);
};

export const canAny = (
  holder: { readonly permissions: readonly Permission[] } | readonly Permission[],
  permissions: readonly Permission[],
): boolean => permissions.some((permission) => can(holder, permission));
