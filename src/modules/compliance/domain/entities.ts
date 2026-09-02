import type { ComplianceStatus } from "@/modules/assessment/domain/entities";
import type { RiskRating } from "@/modules/gap/domain/risk";

export interface ThemeBreakdown {
  readonly themeCode: string;
  readonly themeName: string;
  readonly total: number;
  readonly byStatus: Readonly<Record<ComplianceStatus, number>>;
  readonly compliancePercent: number;
  readonly openGaps: number;
}

export interface TrendPoint {
  readonly label: string;
  readonly compliancePercent: number;
}

export interface ComplianceOverview {
  readonly assessment: {
    readonly id: string;
    readonly reference: string;
    readonly title: string;
    readonly status: string;
    readonly startedAt: Date;
    readonly compliancePercent: number;
    readonly completionPercent: number;
    readonly byStatus: Readonly<Record<ComplianceStatus, number>>;
  } | null;
  readonly themes: readonly ThemeBreakdown[];
  readonly gapsByRisk: Readonly<Record<RiskRating, number>>;
  readonly trend: readonly TrendPoint[];
}

/**
 * Re-exported so the dashboard and reports read the percentage from the same
 * place the assessment module writes it. There is deliberately no second
 * implementation of the formula here.
 */
export {
  COMPLIANCE_FORMULA_NOTE,
  compliancePercentOf,
  scoreCompliance,
} from "@/modules/assessment/domain/scoring";
export type { ComplianceScore } from "@/modules/assessment/domain/scoring";
