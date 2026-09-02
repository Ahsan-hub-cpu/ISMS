import { NotFoundError } from "@/shared/core/errors";
import type { Paginated } from "@/shared/core/pagination";
import { failure, success, type Result } from "@/shared/core/result";

import type { Control } from "../../domain/entities";
import type { FrameworkRepository } from "../ports/framework-repository";
import type { ControlQuery } from "../schemas";

export const searchControls =
  (frameworks: FrameworkRepository) =>
  async (frameworkCode: string, query: ControlQuery): Promise<Result<Paginated<Control>>> => {
    const framework = await frameworks.findFrameworkByCode(frameworkCode);

    if (!framework) {
      return failure(new NotFoundError("Framework", frameworkCode));
    }

    return success(await frameworks.searchControls(framework.id, query));
  };
