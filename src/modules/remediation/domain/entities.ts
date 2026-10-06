export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REMEDIATION_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
  "CANCELLED",
] as const;
export type RemediationStatus = (typeof REMEDIATION_STATUSES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const REMEDIATION_STATUS_LABELS: Record<RemediationStatus, string> = {
  OPEN: "Open — not started",
  IN_PROGRESS: "In progress — owner working",
  IN_REVIEW: "Waiting for approval — assessor",
  COMPLETED: "Completed — done",
  CANCELLED: "Cancelled",
};

export const REMEDIATION_STATUS_HINTS: Record<RemediationStatus, string> = {
  OPEN: "Owner has not started the fix yet.",
  IN_PROGRESS: "Owner is working. Progress % can move; at 100% it goes to Waiting for approval.",
  IN_REVIEW:
    "Waiting for approval. Owner finished at 100%. Assessor Accepts evidence → Completed (then close the gap).",
  COMPLETED: "Assessor accepted the fix. Editing is locked. Close the linked gap next.",
  CANCELLED: "This action will not be done.",
};

export interface RemediationComment {
  readonly id: string;
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: Date;
}

export interface RemediationAction {
  readonly id: string;
  readonly reference: string;
  readonly title: string;
  readonly description: string;
  readonly gapId: string | null;
  readonly gapReference: string | null;
  readonly controlId: string | null;
  readonly controlCode: string | null;
  readonly controlTitle: string | null;
  readonly ownerId: string | null;
  readonly ownerName: string | null;
  readonly priority: Priority;
  readonly status: RemediationStatus;
  readonly progressPercent: number;
  readonly dueAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly comments: readonly RemediationComment[];
  readonly evidenceCount: number;
}

export interface RemediationSummary {
  readonly total: number;
  readonly outstanding: number;
  readonly overdue: number;
  readonly completed: number;
  readonly byStatus: Readonly<Record<RemediationStatus, number>>;
}

export const isClosed = (status: RemediationStatus) =>
  status === "COMPLETED" || status === "CANCELLED";

export const isOverdue = (action: Pick<RemediationAction, "status" | "dueAt">, now = new Date()) =>
  !isClosed(action.status) && action.dueAt !== null && action.dueAt < now;

/** Progress implied by a status change, so the two never contradict each other. */
export const progressForStatus = (
  status: RemediationStatus,
  current: number,
): number => {
  if (status === "COMPLETED") return 100;
  if (status === "OPEN") return Math.min(current, 10);
  if (status === "IN_REVIEW") return Math.max(current, 90);
  return current;
};
