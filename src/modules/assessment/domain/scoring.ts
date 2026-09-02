import { COMPLIANCE_STATUSES, type ComplianceStatus } from "./entities";

/**
 * THE ONE COMPLIANCE FORMULA. The dashboard, the theme breakdown, the
 * assessment progress bar and every CSV export call this function, so a figure
 * shown on screen and a figure in a report can never drift apart.
 *
 * ISO/IEC 27001 does not define a compliance percentage. This is the project's
 * own measure, defined as:
 *
 *   in scope   = Compliant + Partially compliant + Non-compliant
 *   credit     = Compliant x 1.0  +  Partially compliant x 0.5
 *   compliance = round(credit / in scope x 100)
 *
 * Two decisions are worth stating explicitly:
 *
 *  - NOT_APPLICABLE controls are excluded from the denominator. A control the
 *    organisation has justified as out of scope should neither help nor hurt
 *    the score; including it would reward writing controls off.
 *  - NOT_ASSESSED controls are also excluded, because nothing is known about
 *    them yet. Progress towards a complete assessment is reported separately as
 *    `completionPercent`, so an early, mostly-unassessed assessment cannot look
 *    falsely good or falsely bad.
 *  - PARTIALLY_COMPLIANT earns half credit. It is a real shortfall that still
 *    raises a gap, but counting it as zero would make partial progress
 *    invisible and discourage recording it honestly.
 */
export const PARTIAL_COMPLIANCE_CREDIT = 0.5;

export const EXCLUDED_FROM_COMPLIANCE: readonly ComplianceStatus[] = [
  "NOT_APPLICABLE",
  "NOT_ASSESSED",
];

export interface ComplianceScore {
  /** Every control in the assessment, whatever its status. */
  readonly total: number;
  /** Controls with a decision recorded, including Not applicable. */
  readonly assessed: number;
  /** Controls counted by the compliance percentage. */
  readonly inScope: number;
  readonly notApplicable: number;
  readonly completionPercent: number;
  readonly compliancePercent: number;
}

export const emptyStatusCounts = (): Record<ComplianceStatus, number> =>
  Object.fromEntries(COMPLIANCE_STATUSES.map((status) => [status, 0])) as Record<
    ComplianceStatus,
    number
  >;

export const scoreCompliance = (
  byStatus: Readonly<Record<ComplianceStatus, number>>,
): ComplianceScore => {
  const total = COMPLIANCE_STATUSES.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0);
  const assessed = total - (byStatus.NOT_ASSESSED ?? 0);
  const inScope =
    (byStatus.COMPLIANT ?? 0) +
    (byStatus.PARTIALLY_COMPLIANT ?? 0) +
    (byStatus.NON_COMPLIANT ?? 0);

  const credit =
    (byStatus.COMPLIANT ?? 0) + (byStatus.PARTIALLY_COMPLIANT ?? 0) * PARTIAL_COMPLIANCE_CREDIT;

  return {
    total,
    assessed,
    inScope,
    notApplicable: byStatus.NOT_APPLICABLE ?? 0,
    completionPercent: total === 0 ? 0 : Math.round((assessed / total) * 100),
    compliancePercent: inScope === 0 ? 0 : Math.round((credit / inScope) * 100),
  };
};

export const compliancePercentOf = (
  byStatus: Readonly<Record<ComplianceStatus, number>>,
): number => scoreCompliance(byStatus).compliancePercent;

/** Wording reused wherever the percentage is displayed or exported. */
export const COMPLIANCE_FORMULA_NOTE =
  "Compliance % = (Compliant + 0.5 x Partially compliant) / (Compliant + Partially compliant + Non-compliant). Not applicable and Not assessed controls are excluded. Project-defined measure, not an ISO/IEC 27001 requirement.";
