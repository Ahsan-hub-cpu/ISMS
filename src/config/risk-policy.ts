/**
 * PROJECT-DEFINED RISK POLICY — NOT PART OF ISO/IEC 27001 OR 27002.
 *
 * ISO/IEC 27001:2022 requires an organisation to run a risk assessment process
 * and to define its own risk criteria (clauses 6.1.2 and 8.2). It does not
 * prescribe a formula, a scale, or how long remediation may take. Everything in
 * this file is therefore the methodology chosen for this project. It is written
 * as configuration so that it can be reviewed, justified and changed in one
 * place, and so that no other module invents its own numbers.
 *
 * The inputs are deliberately limited to facts the application already holds:
 * the assessor's finding, the ISO/IEC 27002:2022 attributes recorded against
 * the control, and the implementation level in the control register.
 */

export const RISK_MODEL_VERSION = "project-risk-model-1.0";

export const RISK_RATINGS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type RiskRating = (typeof RISK_RATINGS)[number];

export const RISK_LABELS: Record<RiskRating, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

/**
 * Each contributing factor and the most it can add. The four factors mirror the
 * questions an assessor would ask: how badly is the requirement missed, how
 * much of the organisation's security is affected, how directly does this
 * control hold the line, and has any work been done at all.
 */
export const RISK_FACTORS = {
  /** How far current practice falls short of the requirement. */
  severity: {
    label: "Severity of the finding",
    maximum: 5,
    points: { NON_COMPLIANT: 5, PARTIALLY_COMPLIANT: 2 },
  },

  /**
   * One point for each of confidentiality, integrity and availability the
   * control protects. Counting them keeps the model neutral: a control is not
   * automatically severe just because confidentiality appears in its
   * ISO/IEC 27002 attributes.
   */
  objectiveImpact: {
    label: "Security objectives affected",
    maximum: 3,
    pointsPerObjective: 1,
  },

  /**
   * A preventive control is a barrier, so its absence exposes the organisation
   * immediately. Detective and corrective controls matter after the fact and
   * carry less weight here.
   */
  controlImportance: {
    label: "Type of control",
    maximum: 2,
    points: { Preventive: 2, Detective: 1, Corrective: 1 },
  },

  /** What the control register says has actually been built. */
  implementation: {
    label: "Implementation recorded in the register",
    maximum: 2,
    points: {
      NOT_IMPLEMENTED: 2,
      PLANNED: 1,
      PARTIALLY_IMPLEMENTED: 1,
      IMPLEMENTED: 0,
      UNKNOWN: 1,
    },
  },
} as const;

export const RISK_MAXIMUM_SCORE =
  RISK_FACTORS.severity.maximum +
  RISK_FACTORS.objectiveImpact.maximum +
  RISK_FACTORS.controlImportance.maximum +
  RISK_FACTORS.implementation.maximum;

/**
 * Bands over the 0–12 scale. They are set so that a rating of Critical needs
 * more than a single strong factor:
 *
 *   11–12  Critical  requirement entirely unmet, broad impact, no work started
 *    9–10  High      entirely unmet, or partly met with several factors stacked
 *    6–8   Medium    a real shortfall with limited spread or work under way
 *    0–5   Low       narrow impact, or largely addressed already
 *
 * Worked examples:
 *   Non-compliant, C+I+A, preventive, nothing implemented   5+3+2+2 = 12 Critical
 *   Non-compliant, confidentiality only, preventive, none   5+1+2+2 = 10 High
 *   Partially compliant, C+I+A, preventive, partly built    2+3+2+1 =  8 Medium
 *   Partially compliant, integrity only, corrective, built  2+1+1+0 =  4 Low
 */
export const RISK_THRESHOLDS: readonly { minimum: number; rating: RiskRating }[] = [
  { minimum: 11, rating: "CRITICAL" },
  { minimum: 9, rating: "HIGH" },
  { minimum: 6, rating: "MEDIUM" },
  { minimum: 0, rating: "LOW" },
];

/**
 * INTERNAL REMEDIATION SLA — a service level this project sets for itself.
 * ISO/IEC 27001 does not state how quickly a nonconformity must be closed; it
 * only requires that corrective action is taken and its effectiveness reviewed.
 */
export const REMEDIATION_SLA_DAYS: Record<RiskRating, number> = {
  CRITICAL: 14,
  HIGH: 30,
  MEDIUM: 60,
  LOW: 90,
};

export const REMEDIATION_SLA_NOTE =
  "Internal project service level, not an ISO/IEC 27001 requirement.";
