export const APPLICABILITIES = ["APPLICABLE", "NOT_APPLICABLE"] as const;
export type Applicability = (typeof APPLICABILITIES)[number];

export const IMPLEMENTATION_STATUSES = [
  "NOT_IMPLEMENTED",
  "PLANNED",
  "PARTIALLY_IMPLEMENTED",
  "IMPLEMENTED",
] as const;
export type ImplementationStatus = (typeof IMPLEMENTATION_STATUSES)[number];

export const APPLICABILITY_LABELS: Record<Applicability, string> = {
  APPLICABLE: "Applicable",
  NOT_APPLICABLE: "Not applicable",
};

export const IMPLEMENTATION_LABELS: Record<ImplementationStatus, string> = {
  NOT_IMPLEMENTED: "Not implemented",
  PLANNED: "Planned",
  PARTIALLY_IMPLEMENTED: "Partially implemented",
  IMPLEMENTED: "Implemented",
};

/** How complete each status counts towards the implementation percentage. */
const IMPLEMENTATION_WEIGHT: Record<ImplementationStatus, number> = {
  NOT_IMPLEMENTED: 0,
  PLANNED: 0.25,
  PARTIALLY_IMPLEMENTED: 0.5,
  IMPLEMENTED: 1,
};

export interface RegisterEntry {
  readonly id: string;
  readonly organizationId: string;
  readonly controlId: string;
  readonly controlCode: string;
  readonly controlTitle: string;
  readonly themeCode: string;
  readonly themeName: string;
  readonly ownerId: string | null;
  readonly ownerName: string | null;
  readonly siteId: string | null;
  readonly siteName: string | null;
  readonly applicability: Applicability;
  readonly justification: string | null;
  readonly implementationStatus: ImplementationStatus;
  readonly implementationNotes: string | null;
  readonly reviewDueAt: Date | null;
  readonly updatedAt: Date;
  /**
   * True when a gap for this control was resolved and nothing is outstanding —
   * the row stays viewable but should not be casually re-edited.
   */
  readonly closureLocked: boolean;
}

export interface RegisterSummary {
  readonly total: number;
  readonly applicable: number;
  readonly excluded: number;
  readonly unassigned: number;
  readonly overdueReviews: number;
  readonly byStatus: Readonly<Record<ImplementationStatus, number>>;
  readonly implementationPercent: number;
}

/**
 * Weighted completion across applicable controls. A partially implemented
 * control counts as half, which reflects reality better than a simple
 * implemented / total ratio.
 */
export const implementationPercent = (
  counts: Readonly<Record<ImplementationStatus, number>>,
): number => {
  const applicable = IMPLEMENTATION_STATUSES.reduce((total, status) => total + counts[status], 0);
  if (applicable === 0) return 0;

  const weighted = IMPLEMENTATION_STATUSES.reduce(
    (total, status) => total + counts[status] * IMPLEMENTATION_WEIGHT[status],
    0,
  );

  return Math.round((weighted / applicable) * 100);
};

export const isReviewOverdue = (entry: Pick<RegisterEntry, "reviewDueAt">, now = new Date()) =>
  entry.reviewDueAt !== null && entry.reviewDueAt < now;
