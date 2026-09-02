import "server-only";

import { COMPLIANCE_STATUS_LABELS } from "@/modules/assessment/domain/entities";
import { GAP_STATUS_LABELS, RISK_LABELS } from "@/modules/gap";
import type { RiskFactor } from "@/modules/gap";
import { prisma } from "@/infrastructure/database/prisma";
import { toCsv } from "@/shared/utils/csv";

export const REPORT_KINDS = ["statement-of-applicability", "gap-register", "remediation-plan"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export const REPORT_LABELS: Record<ReportKind, string> = {
  "statement-of-applicability": "Statement of applicability",
  "gap-register": "Gap register",
  "remediation-plan": "Remediation plan",
};

/** The assessment the dashboard reports on, so exports show the same figures. */
const latestAssessmentId = async (organizationId: string): Promise<string | null> => {
  const assessment = await prisma.assessment.findFirst({
    where: { organizationId },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  return assessment?.id ?? null;
};

const statementOfApplicability = async (organizationId: string) => {
  const assessmentId = await latestAssessmentId(organizationId);

  const [entries, items] = await Promise.all([
    prisma.registerEntry.findMany({
      where: { organizationId },
      include: { control: { include: { theme: true } }, owner: true, site: true },
      orderBy: { control: { sortOrder: "asc" } },
    }),
    assessmentId
      ? prisma.assessmentItem.findMany({
          where: { assessmentId },
          select: { controlId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const findingByControl = new Map(items.map((item) => [item.controlId, item.status]));

  return toCsv(
    [
      "Control",
      "Title",
      "Theme",
      "Applicable",
      "Justification",
      "Implementation status",
      "Latest finding",
      "Owner",
      "Site",
      "Review due",
    ],
    entries.map((entry) => [
      entry.control.code,
      entry.control.title,
      entry.control.theme.name,
      entry.applicability === "APPLICABLE" ? "Yes" : "No",
      entry.justification,
      entry.implementationStatus,
      COMPLIANCE_STATUS_LABELS[findingByControl.get(entry.controlId) ?? "NOT_ASSESSED"],
      entry.owner?.fullName,
      entry.site?.name,
      entry.reviewDueAt,
    ]),
  );
};

/** Renders stored scoring factors so a reader can check the rating themselves. */
const describeRisk = (factors: unknown): string =>
  Array.isArray(factors)
    ? (factors as RiskFactor[])
        .map((factor) => `${factor.label}: ${factor.points}/${factor.maximum}`)
        .join("; ")
    : "";

const gapRegister = async () => {
  const gaps = await prisma.gap.findMany({
    include: {
      control: true,
      assessment: { select: { reference: true } },
      identifiedBy: { select: { fullName: true } },
      verifiedBy: { select: { fullName: true } },
    },
    orderBy: [{ riskRating: "desc" }, { reference: "asc" }],
  });

  return toCsv(
    [
      "Reference",
      "Assessment",
      "Control",
      "Summary",
      "Risk",
      "Risk score",
      "Risk basis",
      "Risk model",
      "Rating overridden",
      "Status",
      "Identified by",
      "Identified on",
      "Verified by",
      "Verified on",
      "Description",
      "Recommendation",
    ],
    gaps.map((gap) => [
      gap.reference,
      gap.assessment.reference,
      `${gap.control.code} ${gap.control.title}`,
      gap.summary,
      RISK_LABELS[gap.riskRating],
      `${gap.riskScore}/${gap.riskMaximumScore}`,
      describeRisk(gap.riskFactors),
      gap.riskModelVersion,
      gap.riskRatingOverridden ? "Yes" : "No",
      GAP_STATUS_LABELS[gap.status],
      gap.identifiedBy?.fullName,
      gap.identifiedAt,
      gap.verifiedBy?.fullName,
      gap.verifiedAt,
      gap.description,
      gap.recommendation,
    ]),
  );
};

const remediationPlan = async (organizationId: string) => {
  const actions = await prisma.remediationAction.findMany({
    where: { organizationId },
    include: { gap: { select: { reference: true, riskRating: true } }, control: true, owner: true },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  return toCsv(
    [
      "Reference",
      "Title",
      "Gap",
      "Gap risk",
      "Control",
      "Owner",
      "Priority",
      "Status",
      "Progress %",
      "Due (internal SLA)",
      "Completed",
    ],
    actions.map((action) => [
      action.reference,
      action.title,
      action.gap?.reference,
      action.gap ? RISK_LABELS[action.gap.riskRating] : null,
      action.control ? `${action.control.code} ${action.control.title}` : null,
      action.owner?.fullName,
      action.priority,
      action.status,
      action.progressPercent,
      action.dueAt,
      action.completedAt,
    ]),
  );
};

/**
 * Produces the CSV body for a report the organisation can hand to an auditor.
 * Every figure is read live from the database and derived with the same
 * functions the dashboard uses, so an export can never lag behind the screen.
 */
export const buildReport = async (kind: ReportKind, organizationId: string): Promise<string> => {
  if (kind === "statement-of-applicability") return statementOfApplicability(organizationId);
  if (kind === "gap-register") return gapRegister();
  return remediationPlan(organizationId);
};
