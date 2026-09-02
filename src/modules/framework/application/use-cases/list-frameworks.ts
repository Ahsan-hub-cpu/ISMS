import { success, type Result } from "@/shared/core/result";

import type { Framework } from "../../domain/entities";
import type { FrameworkRepository } from "../ports/framework-repository";

export const listFrameworks =
  (frameworks: FrameworkRepository) =>
  async (): Promise<Result<readonly Framework[]>> =>
    success(await frameworks.listFrameworks());
