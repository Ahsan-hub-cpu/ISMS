import { getControl } from "./application/use-cases/get-control";
import { getFrameworkCatalogue } from "./application/use-cases/get-framework-catalogue";
import { listFrameworks } from "./application/use-cases/list-frameworks";
import { searchControls } from "./application/use-cases/search-controls";
import { prismaFrameworkRepository } from "./infrastructure/prisma-framework-repository";

/** Composition root for the framework and control catalogue module. */
export const frameworkService = {
  listFrameworks: listFrameworks(prismaFrameworkRepository),
  getCatalogue: getFrameworkCatalogue(prismaFrameworkRepository),
  searchControls: searchControls(prismaFrameworkRepository),
  getControl: getControl(prismaFrameworkRepository),
  findByCode: (code: string) => prismaFrameworkRepository.findFrameworkByCode(code),
};

export type {
  Control,
  ControlTheme,
  ControlWithTheme,
  Framework,
  FrameworkCatalogue,
  ThemeSummary,
} from "./domain/entities";
