/**
 * ISO/IEC 27002:2022 introduced five attributes that let the same catalogue be
 * viewed from different angles:
 *
 *   1. Control type                    (preventive / detective / corrective)
 *   2. Information security properties (confidentiality / integrity / availability)
 *   3. Cybersecurity concepts          (identify / protect / detect / respond / recover)
 *   4. Operational capabilities        (15 values, e.g. governance, asset management)
 *   5. Security domains                (governance and ecosystem, protection, defence, resilience)
 *
 * This project models the first three. They are the ones the application
 * actually uses: they drive catalogue filtering and they feed the project's own
 * risk scoring model. Operational capabilities and security domains are
 * deliberately out of scope — nothing in the application would read them, and
 * carrying 15 unused labels per control would be noise.
 *
 * The value sets below are complete for the three attributes we do model, so an
 * attribute filter never silently hides a control. They are modelled as domain
 * vocabularies rather than free text so filtering can never depend on how a
 * string happened to be typed into the database.
 *
 * The attribute *values* an individual control carries in
 * `prisma/data/iso-27001-2022-annex-a.json` are this project's own reading of
 * each control, recorded for the application's benefit. They are not reproduced
 * from the standard's attribute tables and should not be presented as such.
 */

/** Attribute categories from ISO/IEC 27002:2022 that this project models. */
export const MODELLED_ATTRIBUTES = [
  "Control type",
  "Information security properties",
  "Cybersecurity concepts",
] as const;

/** Attribute categories that exist in ISO/IEC 27002:2022 but are out of scope here. */
export const UNMODELLED_ATTRIBUTES = ["Operational capabilities", "Security domains"] as const;

export const CONTROL_TYPES = ["Preventive", "Detective", "Corrective"] as const;
export type ControlType = (typeof CONTROL_TYPES)[number];

export const SECURITY_PROPERTIES = ["Confidentiality", "Integrity", "Availability"] as const;
export type SecurityProperty = (typeof SECURITY_PROPERTIES)[number];

export const CYBERSECURITY_CONCEPTS = [
  "Identify",
  "Protect",
  "Detect",
  "Respond",
  "Recover",
] as const;
export type CybersecurityConcept = (typeof CYBERSECURITY_CONCEPTS)[number];

export const CONTROL_TYPE_HINTS: Record<ControlType, string> = {
  Preventive: "Stops an incident before it happens.",
  Detective: "Reveals that something has happened.",
  Corrective: "Limits damage and restores normal operation.",
};

const asMember = <T extends string>(allowed: readonly T[]) => {
  const set = new Set<string>(allowed);
  return (values: readonly string[]): T[] => values.filter((value): value is T => set.has(value));
};

export const toControlTypes = asMember(CONTROL_TYPES);
export const toSecurityProperties = asMember(SECURITY_PROPERTIES);
export const toCybersecurityConcepts = asMember(CYBERSECURITY_CONCEPTS);
