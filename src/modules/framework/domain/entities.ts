import type { ControlType, CybersecurityConcept, SecurityProperty } from "./attributes";

export interface Framework {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly publisher: string;
  readonly description: string;
  readonly isActive: boolean;
}

export interface ControlTheme {
  readonly id: string;
  readonly frameworkId: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly sortOrder: number;
}

export interface Control {
  readonly id: string;
  readonly frameworkId: string;
  readonly themeId: string;
  readonly code: string;
  readonly title: string;
  readonly purpose: string;
  readonly description: string;
  readonly controlTypes: readonly ControlType[];
  readonly securityProperties: readonly SecurityProperty[];
  readonly cybersecurityConcepts: readonly CybersecurityConcept[];
  readonly sortOrder: number;
}

export interface ThemeSummary extends ControlTheme {
  readonly controlCount: number;
}

/** A framework with its themes and how many controls each one contains. */
export interface FrameworkCatalogue {
  readonly framework: Framework;
  readonly themes: readonly ThemeSummary[];
  readonly controlCount: number;
}

export interface ControlWithTheme extends Control {
  readonly theme: ControlTheme;
}

/**
 * Annex A codes such as "A.5.10" must sort numerically, not alphabetically,
 * otherwise A.5.10 would appear before A.5.2.
 */
export const controlSortOrder = (code: string): number => {
  const [theme = "0", index = "0"] = code.replace(/^A\./, "").split(".");
  return Number(theme) * 1000 + Number(index);
};
