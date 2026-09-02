import { success, type Result } from "@/shared/core/result";

import { buildReport, REPORT_KINDS, REPORT_LABELS, type ReportKind } from "./application/reports";
import type { ComplianceOverview } from "./domain/entities";
import { prismaComplianceRepository } from "./infrastructure/prisma-compliance-repository";

/** Composition root for the compliance dashboard and exports. */
export const complianceService = {
  overview: async (
    organizationId: string,
    assessmentId?: string,
  ): Promise<Result<ComplianceOverview>> =>
    success(await prismaComplianceRepository.overview(organizationId, assessmentId)),

  report: (kind: ReportKind, organizationId: string) => buildReport(kind, organizationId),
};

export { REPORT_KINDS, REPORT_LABELS };
export type { ReportKind } from "./application/reports";
export type { ComplianceOverview, ThemeBreakdown, TrendPoint } from "./domain/entities";
