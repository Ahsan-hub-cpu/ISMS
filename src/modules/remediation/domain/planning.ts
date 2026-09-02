import { REMEDIATION_SLA_NOTE } from "@/config/risk-policy";
import { remediationDueDays, type RiskRating } from "@/modules/gap/domain/risk";

import type { Priority } from "./entities";

/** A gap's risk rating drives how urgent its remediation action is. */
export const priorityFromRisk: Record<RiskRating, Priority> = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

/**
 * Days allowed for each rating. Re-exported from the central risk policy so the
 * SLA is stated once; these are this project's own targets, not ISO rules.
 */
export const slaDays = remediationDueDays;
export { REMEDIATION_SLA_NOTE };

export const dueDateFromRisk = (rating: RiskRating, from = new Date()): Date => {
  const due = new Date(from);
  due.setDate(due.getDate() + slaDays[rating]);
  return due;
};

export const actionTitleForGap = (controlCode: string, controlTitle: string): string =>
  `Remediate ${controlCode} ${controlTitle}`;
