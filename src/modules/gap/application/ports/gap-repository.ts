import type { Paginated } from "@/shared/core/pagination";

import type { ClosureContext, Gap, GapStatus, GapSummary } from "../../domain/entities";
import type { RiskAssessment, RiskRating } from "../../domain/risk";
import type { GapQuery, UpdateGapInput } from "../schemas";

/** Everything the risk calculation and generated wording need about a control. */
export interface ControlContext {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly purpose: string;
  readonly themeCode: string;
  readonly securityProperties: readonly string[];
  readonly controlTypes: readonly string[];
  readonly cybersecurityConcepts: readonly string[];
}

export interface NewGap {
  readonly assessmentId: string;
  readonly assessmentItemId: string;
  readonly controlId: string;
  readonly reference: string;
  readonly summary: string;
  readonly description: string;
  readonly recommendation: string;
  readonly risk: RiskAssessment;
  readonly identifiedById: string | null;
}

export interface GapRecord {
  readonly id: string;
  readonly reference: string;
  readonly status: GapStatus;
  readonly riskRating: RiskRating;
}

export interface GapRepository {
  findControlContext(controlId: string): Promise<ControlContext | null>;
  /** Everything needed to re-derive a gap's rating and show the reasoning. */
  findRiskContext(
    gapId: string,
  ): Promise<{ control: ControlContext; complianceStatus: string } | null>;
  findByAssessmentItem(assessmentItemId: string): Promise<GapRecord | null>;
  nextReference(): Promise<string>;
  create(data: NewGap): Promise<GapRecord>;
  /**
   * Re-applies the generated draft and the recalculated risk. Wording the
   * assessor has edited and a rating they have overridden are left alone.
   */
  refresh(
    id: string,
    data: {
      summary: string;
      description: string;
      recommendation: string;
      risk: RiskAssessment;
    },
  ): Promise<GapRecord>;
  setStatus(
    id: string,
    status: GapStatus,
    options?: { resolvedAt?: Date | null; verifiedById?: string | null; verifiedAt?: Date | null },
  ): Promise<void>;
  /** Counts the evidence and reassessment facts that gate closure. */
  closureContext(id: string): Promise<ClosureContext | null>;
  list(query: GapQuery): Promise<Paginated<Gap>>;
  findById(id: string): Promise<Gap | null>;
  update(id: string, changes: UpdateGapInput, actorId: string): Promise<Gap>;
  summarise(): Promise<GapSummary>;
}
