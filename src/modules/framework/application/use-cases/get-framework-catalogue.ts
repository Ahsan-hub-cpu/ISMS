import { NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { FrameworkCatalogue } from "../../domain/entities";
import type { FrameworkRepository } from "../ports/framework-repository";

/** Loads a framework with its themes and control counts for the browse screen. */
export const getFrameworkCatalogue =
  (frameworks: FrameworkRepository) =>
  async (frameworkCode: string): Promise<Result<FrameworkCatalogue>> => {
    const framework = await frameworks.findFrameworkByCode(frameworkCode);

    if (!framework) {
      return failure(new NotFoundError("Framework", frameworkCode));
    }

    const [themes, controlCount] = await Promise.all([
      frameworks.listThemeSummaries(framework.id),
      frameworks.countControls(framework.id),
    ]);

    return success({ framework, themes, controlCount });
  };
