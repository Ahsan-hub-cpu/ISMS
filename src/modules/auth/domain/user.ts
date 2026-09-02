export const USER_ROLES = ["ADMINISTRATOR", "ASSESSOR", "CONTROL_OWNER", "VIEWER"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRATOR: "Administrator",
  ASSESSOR: "Assessor / Compliance Officer",
  CONTROL_OWNER: "Control Owner",
  VIEWER: "Viewer / Management",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMINISTRATOR: "Manages users, roles, framework data and system configuration.",
  ASSESSOR: "Performs assessments, records findings and verifies closure.",
  CONTROL_OWNER: "Owns assigned controls and provides progress and evidence.",
  VIEWER: "Reads dashboards and reports without changing assessment data.",
};

export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly jobTitle: string | null;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly siteId: string | null;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
}

/** A user together with the secret needed to verify a sign-in attempt. */
export interface UserWithCredentials extends User {
  readonly passwordHash: string;
}

/** The subset of user data carried in the session cookie. */
export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
}

export const toSessionUser = (user: User): SessionUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const initialsOf = (fullName: string): string =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
