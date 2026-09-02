import type { RiskFactor, RiskRating } from "./risk";

export const GAP_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "AWAITING_REVIEW",
  "RESOLVED",
  "RISK_ACCEPTED",
] as const;
export type GapStatus = (typeof GAP_STATUSES)[number];

export const GAP_STATUS_LABELS: Record<GapStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  AWAITING_REVIEW: "Awaiting review",
  RESOLVED: "Resolved",
  RISK_ACCEPTED: "Risk accepted",
};

export const GAP_STATUS_HINTS: Record<GapStatus, string> = {
  OPEN: "Raised by an assessment finding, no remediation work started yet.",
  IN_PROGRESS: "Remediation is under way.",
  AWAITING_REVIEW: "The owner believes the gap is closed; an assessor must verify it.",
  RESOLVED: "An assessor verified the fix and closed the gap.",
  RISK_ACCEPTED: "Management accepted the exposure instead of remediating it.",
};

/**
 * A gap is never closed by the system on its own. Reaching RESOLVED requires an
 * assessor to act from AWAITING_REVIEW, which is why that edge is the only path
 * into a closed state other than an explicit risk acceptance.
 */
export const GAP_TRANSITIONS: Record<GapStatus, readonly GapStatus[]> = {
  OPEN: ["IN_PROGRESS", "AWAITING_REVIEW", "RISK_ACCEPTED"],
  IN_PROGRESS: ["OPEN", "AWAITING_REVIEW", "RISK_ACCEPTED"],
  AWAITING_REVIEW: ["IN_PROGRESS", "RESOLVED", "RISK_ACCEPTED"],
  RESOLVED: ["IN_PROGRESS"],
  RISK_ACCEPTED: ["OPEN", "IN_PROGRESS"],
};

export const canTransition = (from: GapStatus, to: GapStatus): boolean =>
  from === to || GAP_TRANSITIONS[from].includes(to);

export interface Gap {
  readonly id: string;
  readonly reference: string;
  readonly assessmentId: string;
  readonly assessmentReference: string;
  readonly assessmentItemId: string;
  readonly controlId: string;
  readonly controlCode: string;
  readonly controlTitle: string;
  readonly themeCode: string;
  readonly summary: string;
  /** The confirmed wording an assessor is accountable for. */
  readonly description: string;
  readonly recommendation: string;
  /** The system's suggestion, kept so an edit can always be compared to it. */
  readonly generatedDescription: string;
  readonly generatedRecommendation: string;
  readonly descriptionEditedAt: Date | null;
  readonly recommendationEditedAt: Date | null;
  readonly riskRating: RiskRating;
  readonly riskScore: number;
  readonly riskMaximumScore: number;
  readonly riskModelVersion: string;
  readonly riskFactors: readonly RiskFactor[];
  readonly riskRatingOverridden: boolean;
  readonly status: GapStatus;
  readonly identifiedByName: string | null;
  readonly identifiedAt: Date;
  readonly verifiedByName: string | null;
  readonly verifiedAt: Date | null;
  readonly resolvedAt: Date | null;
  readonly openActions: number;
}

export interface GapSummary {
  readonly total: number;
  readonly open: number;
  readonly awaitingReview: number;
  readonly resolved: number;
  readonly accepted: number;
  readonly byRisk: Readonly<Record<RiskRating, number>>;
}

/** A gap only counts against the organisation while it is still being worked on. */
export const isOutstanding = (status: GapStatus) =>
  status === "OPEN" || status === "IN_PROGRESS" || status === "AWAITING_REVIEW";

export const isClosed = (status: GapStatus) =>
  status === "RESOLVED" || status === "RISK_ACCEPTED";

export interface ClosureContext {
  readonly status: GapStatus;
  readonly openActions: number;
  readonly pendingEvidence: number;
  readonly acceptedEvidence: number;
  /** True once a later finding recorded the control as compliant. */
  readonly reassessedCompliant: boolean;
}

/**
 * Reasons a gap cannot be closed yet. Returning them as a list lets the API
 * refuse the change and the detail page explain what is still missing, without
 * either side re-implementing the rules.
 */
export const closureBlockers = (context: ClosureContext): string[] => {
  const blockers: string[] = [];

  if (!canTransition(context.status, "RESOLVED")) {
    blockers.push(
      "A gap can only be resolved from Awaiting review, so that an assessor verifies the fix.",
    );
  }

  if (context.openActions > 0) {
    blockers.push(
      `${context.openActions} remediation action${context.openActions === 1 ? " is" : "s are"} still open.`,
    );
  }

  if (context.pendingEvidence > 0) {
    blockers.push(
      context.pendingEvidence === 1
        ? "1 piece of evidence still awaits review."
        : `${context.pendingEvidence} pieces of evidence still await review.`,
    );
  }

  if (!context.reassessedCompliant && context.acceptedEvidence === 0) {
    blockers.push(
      "Closure needs verification: reassess the control as compliant, or accept at least one piece of evidence.",
    );
  }

  return blockers;
};

/**
 * Wording proposed for an automatically identified gap. It is a draft only: the
 * assessor owns the final text and may replace it on the gap detail page.
 */
export const draftGapWording = (input: {
  controlCode: string;
  controlTitle: string;
  purpose: string;
  currentPractice: string | null;
  fullShortfall: boolean;
}): { summary: string; description: string; recommendation: string } => {
  const practice = input.currentPractice?.trim()
    ? input.currentPractice.trim()
    : "No current practice was recorded during the assessment.";

  return {
    summary: input.fullShortfall
      ? `${input.controlCode} is not implemented`
      : `${input.controlCode} is only partially implemented`,
    description: [
      `Requirement: ${input.controlTitle}. ${input.purpose}`,
      `Current practice: ${practice}`,
    ].join("\n\n"),
    recommendation: input.fullShortfall
      ? `Implement ${input.controlCode} ${input.controlTitle} and record the evidence that demonstrates it.`
      : `Complete the outstanding parts of ${input.controlCode} ${input.controlTitle} and record supporting evidence.`,
  };
};
