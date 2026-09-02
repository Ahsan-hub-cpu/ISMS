export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "SUBMIT",
  "APPROVE",
  "REVIEW",
  "VERIFY",
  "REJECT",
  "SIGN_IN",
  "SIGN_OUT",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  SUBMIT: "Submitted",
  APPROVE: "Approved",
  REVIEW: "Reviewed",
  VERIFY: "Verified",
  REJECT: "Rejected",
  SIGN_IN: "Signed in",
  SIGN_OUT: "Signed out",
};

export interface AuditEntry {
  readonly id: string;
  readonly actorId: string | null;
  readonly actorEmail: string;
  readonly actorName: string;
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly summary: string;
  readonly createdAt: Date;
}

/** What a use case supplies when something noteworthy happens. */
export interface AuditDraft {
  readonly actor: { id: string; email: string; fullName: string } | null;
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId?: string | null;
  readonly summary: string;
}
