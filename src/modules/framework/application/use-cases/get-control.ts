import { NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { Control, ControlWithTheme, Framework } from "../../domain/entities";
import type { FrameworkRepository } from "../ports/framework-repository";

export interface ControlDetail {
  readonly framework: Framework;
  readonly control: ControlWithTheme;
  readonly previous: Control | null;
  readonly next: Control | null;
}

/** Loads one control plus its neighbours so the detail screen can offer paging. */
export const getControl =
  (frameworks: FrameworkRepository) =>
  async (frameworkCode: string, controlCode: string): Promise<Result<ControlDetail>> => {
    const framework = await frameworks.findFrameworkByCode(frameworkCode);

    if (!framework) {
      return failure(new NotFoundError("Framework", frameworkCode));
    }

    const control = await frameworks.findControlByCode(framework.id, controlCode);

    if (!control) {
      return failure(new NotFoundError("Control", controlCode));
    }

    const { previous, next } = await frameworks.findAdjacentControls(
      framework.id,
      control.sortOrder,
    );

    return success({ framework, control, previous, next });
  };
