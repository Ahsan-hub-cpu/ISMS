import {
  REMEDIATION_SLA_DAYS,
  RISK_FACTORS,
  RISK_MAXIMUM_SCORE,
  RISK_MODEL_VERSION,
  RISK_THRESHOLDS,
} from "@/config/risk-policy";
import type { ImplementationStatus } from "@/modules/register/domain/entities";

export { RISK_LABELS, RISK_RATINGS, RISK_MODEL_VERSION, RISK_MAXIMUM_SCORE } from "@/config/risk-policy";
export type { RiskRating } from "@/config/risk-policy";

import type { RiskRating } from "@/config/risk-policy";

export interface RiskFactor {
  /** Stable key of the factor in the risk policy, kept for audit and reporting. */
  readonly code: keyof typeof RISK_FACTORS;
  readonly label: string;
  /** What was observed, in words, so the score can be defended without the code. */
  readonly detail: string;
  readonly points: number;
  readonly maximum: number;
}

export interface RiskAssessment {
  readonly rating: RiskRating;
  readonly score: number;
  readonly maximumScore: number;
  readonly modelVersion: string;
  readonly factors: readonly RiskFactor[];
}

export interface RiskInput {
  /** How far current practice falls short of the requirement. */
  readonly shortfall: "PARTIAL" | "NONE_IN_PLACE";
  readonly securityProperties: readonly string[];
  readonly controlTypes: readonly string[];
  readonly implementationStatus: ImplementationStatus | null;
}

const OBJECTIVES = ["Confidentiality", "Integrity", "Availability"] as const;

/**
 * Applies the project's own risk scoring methodology (see
 * `src/config/risk-policy.ts`). ISO/IEC 27001 requires an organisation to
 * define risk criteria but does not define this formula — it is application
 * logic chosen for this project so that ratings are consistent between
 * assessors instead of being a personal judgement typed into a box.
 *
 * Every factor is returned with the points it contributed and a plain-language
 * reason, and the caller stores them alongside the gap so the rating can always
 * be explained after the fact.
 */
export const calculateRisk = (input: RiskInput): RiskAssessment => {
  const factors: RiskFactor[] = [];

  const severityPoints =
    input.shortfall === "NONE_IN_PLACE"
      ? RISK_FACTORS.severity.points.NON_COMPLIANT
      : RISK_FACTORS.severity.points.PARTIALLY_COMPLIANT;

  factors.push({
    code: "severity",
    label: RISK_FACTORS.severity.label,
    detail:
      input.shortfall === "NONE_IN_PLACE"
        ? "Assessed as non-compliant: the requirement is not met at all."
        : "Assessed as partially compliant: part of the requirement is already met.",
    points: severityPoints,
    maximum: RISK_FACTORS.severity.maximum,
  });

  const objectives = OBJECTIVES.filter((objective) =>
    input.securityProperties.includes(objective),
  );
  factors.push({
    code: "objectiveImpact",
    label: RISK_FACTORS.objectiveImpact.label,
    detail: objectives.length
      ? `The control protects ${objectives.join(", ").toLowerCase()}.`
      : "No security objective is recorded against this control.",
    points: Math.min(
      objectives.length * RISK_FACTORS.objectiveImpact.pointsPerObjective,
      RISK_FACTORS.objectiveImpact.maximum,
    ),
    maximum: RISK_FACTORS.objectiveImpact.maximum,
  });

  const importancePoints = Math.max(
    0,
    ...input.controlTypes.map(
      (type) => RISK_FACTORS.controlImportance.points[
        type as keyof typeof RISK_FACTORS.controlImportance.points
      ] ?? 0,
    ),
  );
  factors.push({
    code: "controlImportance",
    label: RISK_FACTORS.controlImportance.label,
    detail: input.controlTypes.includes("Preventive")
      ? "Preventive control, so its absence removes a barrier rather than a warning."
      : input.controlTypes.length
        ? `${input.controlTypes.join(" and ")} control, which acts after an event.`
        : "No control type is recorded against this control.",
    points: importancePoints,
    maximum: RISK_FACTORS.controlImportance.maximum,
  });

  const implementation = input.implementationStatus ?? "UNKNOWN";
  factors.push({
    code: "implementation",
    label: RISK_FACTORS.implementation.label,
    detail:
      implementation === "UNKNOWN"
        ? "The control register holds no implementation decision yet."
        : `The control register records this control as ${implementation.toLowerCase().replace(/_/g, " ")}.`,
    points: RISK_FACTORS.implementation.points[implementation],
    maximum: RISK_FACTORS.implementation.maximum,
  });

  const score = factors.reduce((total, factor) => total + factor.points, 0);
  const rating =
    RISK_THRESHOLDS.find((threshold) => score >= threshold.minimum)?.rating ?? "LOW";

  return {
    rating,
    score,
    maximumScore: RISK_MAXIMUM_SCORE,
    modelVersion: RISK_MODEL_VERSION,
    factors,
  };
};

/**
 * Days allowed to close a gap. This is an internal project service level, not
 * an ISO/IEC 27001 requirement; the values live in the risk policy config.
 */
export const remediationDueDays: Record<RiskRating, number> = REMEDIATION_SLA_DAYS;
