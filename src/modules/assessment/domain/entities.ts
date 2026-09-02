import { scoreCompliance } from "./scoring";

export const ASSESSMENT_STATUSES = ["DRAFT", "IN_PROGRESS", "SUBMITTED", "APPROVED"] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const COMPLIANCE_STATUSES = [
  "NOT_ASSESSED",
  "COMPLIANT",
  "PARTIALLY_COMPLIANT",
  "NON_COMPLIANT",
  "NOT_APPLICABLE",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted for approval",
  APPROVED: "Approved",
};

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  NOT_ASSESSED: "Not assessed",
  COMPLIANT: "Compliant",
  PARTIALLY_COMPLIANT: "Partially compliant",
  NON_COMPLIANT: "Non-compliant",
  NOT_APPLICABLE: "Not applicable",
};

/** Findings that fall short of the requirement and therefore raise a gap. */
export const SHORTFALL_STATUSES: readonly ComplianceStatus[] = [
  "PARTIALLY_COMPLIANT",
  "NON_COMPLIANT",
];

export interface AssessmentProgress {
  readonly total: number;
  readonly assessed: number;
  readonly completionPercent: number;
  readonly compliancePercent: number;
  readonly byStatus: Readonly<Record<ComplianceStatus, number>>;
}

export interface Assessment {
  readonly id: string;
  readonly reference: string;
  readonly title: string;
  readonly scope: string;
  readonly status: AssessmentStatus;
  readonly frameworkId: string;
  readonly frameworkCode: string;
  readonly frameworkName: string;
  readonly leadAssessorId: string;
  readonly leadAssessorName: string;
  readonly approvedByName: string | null;
  readonly startedAt: Date;
  readonly submittedAt: Date | null;
  readonly approvedAt: Date | null;
  readonly progress: AssessmentProgress;
}

export interface AssessmentItem {
  readonly id: string;
  readonly assessmentId: string;
  readonly controlId: string;
  readonly controlCode: string;
  readonly controlTitle: string;
  readonly controlPurpose: string;
  readonly themeCode: string;
  readonly themeName: string;
  readonly status: ComplianceStatus;
  readonly currentPractice: string | null;
  readonly rationale: string | null;
  readonly assessedByName: string | null;
  readonly assessedAt: Date | null;
  readonly gapReference: string | null;
  readonly gapRiskRating: string | null;
  readonly evidenceCount: number;
}

/** Delegates to the single compliance formula in `./scoring`. */
export const summariseProgress = (
  byStatus: Readonly<Record<ComplianceStatus, number>>,
): AssessmentProgress => {
  const score = scoreCompliance(byStatus);

  return {
    total: score.total,
    assessed: score.assessed,
    completionPercent: score.completionPercent,
    compliancePercent: score.compliancePercent,
    byStatus,
  };
};

export const isEditable = (status: AssessmentStatus) =>
  status === "DRAFT" || status === "IN_PROGRESS";
