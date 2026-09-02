import type { RiskRating } from "../../domain/risk";

export interface PlannedAction {
  readonly actor: { id: string; email: string; fullName: string } | null;
  readonly organizationId: string;
  readonly gapId: string;
  readonly gapReference: string;
  readonly controlId: string;
  readonly controlCode: string;
  readonly controlTitle: string;
  readonly recommendation: string;
  readonly riskRating: RiskRating;
}

/**
 * Implemented by the remediation module. The gap module asks for an action to
 * exist without knowing how remediation is stored or numbered.
 */
export interface RemediationPlanner {
  ensureActionForGap(plan: PlannedAction): Promise<void>;
  /** Parks open actions in review once the control is reassessed as compliant. */
  onGapAwaitingReview(gapId: string): Promise<void>;
  countOpenActions(gapId: string): Promise<number>;
}
