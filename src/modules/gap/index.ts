import { auditService } from "@/modules/audit";
import { registerService } from "@/modules/register";
import { remediationPlanner } from "@/modules/remediation";
import { success, type Result } from "@/shared/core/result";
import type { Paginated } from "@/shared/core/pagination";

import { synchroniseGap } from "./application/use-cases/synchronise-gap";
import { updateGap } from "./application/use-cases/update-gap";
import type { GapQuery } from "./application/schemas";
import { closureBlockers, type Gap, type GapSummary } from "./domain/entities";
import { prismaGapRepository } from "./infrastructure/prisma-gap-repository";
import { prismaResolutionPropagator } from "./infrastructure/prisma-resolution-propagator";

const dependencies = {
  gaps: prismaGapRepository,
  planner: remediationPlanner,
  audit: auditService.record,
  implementationStatusFor: registerService.implementationStatusFor,
  propagator: prismaResolutionPropagator,
};

/** Composition root for the gap register. */
export const gapService = {
  list: async (query: GapQuery): Promise<Result<Paginated<Gap>>> =>
    success(await prismaGapRepository.list(query)),

  findById: (id: string) => prismaGapRepository.findById(id),

  summarise: async (): Promise<Result<GapSummary>> =>
    success(await prismaGapRepository.summarise()),

  /**
   * What still stands between this gap and closure. The gap detail page shows
   * the same list the API enforces, so the two can never disagree.
   */
  closureBlockers: async (gapId: string): Promise<string[]> => {
    const context = await prismaGapRepository.closureContext(gapId);
    return context ? closureBlockers(context) : [];
  },

  update: updateGap(dependencies),

  /** Called by the assessment module whenever a finding is recorded. */
  synchronise: synchroniseGap(dependencies),
};

export type { ClosureContext, Gap, GapStatus, GapSummary } from "./domain/entities";
export {
  GAP_STATUS_HINTS,
  GAP_STATUS_LABELS,
  GAP_STATUSES,
  GAP_TRANSITIONS,
  canTransition,
  isClosed,
  isOutstanding,
} from "./domain/entities";
export {
  RISK_LABELS,
  RISK_MAXIMUM_SCORE,
  RISK_MODEL_VERSION,
  RISK_RATINGS,
  calculateRisk,
  remediationDueDays,
} from "./domain/risk";
export type { RiskAssessment, RiskFactor, RiskRating } from "./domain/risk";
