import type { Paginated } from "@/shared/core/pagination";

import type { Control, ControlWithTheme, Framework, ThemeSummary } from "../../domain/entities";
import type { ControlQuery } from "../schemas";

export interface FrameworkRepository {
  listFrameworks(): Promise<Framework[]>;
  findFrameworkByCode(code: string): Promise<Framework | null>;
  listThemeSummaries(frameworkId: string): Promise<ThemeSummary[]>;
  countControls(frameworkId: string): Promise<number>;
  searchControls(frameworkId: string, query: ControlQuery): Promise<Paginated<Control>>;
  findControlByCode(frameworkId: string, controlCode: string): Promise<ControlWithTheme | null>;
  findAdjacentControls(
    frameworkId: string,
    sortOrder: number,
  ): Promise<{ previous: Control | null; next: Control | null }>;
}
