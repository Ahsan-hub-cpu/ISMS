import { auditService } from "@/modules/audit";
import { success, type Result } from "@/shared/core/result";
import type { Paginated } from "@/shared/core/pagination";

import { synchroniseRegister } from "./application/use-cases/synchronise-register";
import { updateRegisterEntry } from "./application/use-cases/update-register-entry";
import type { RegisterQuery } from "./application/schemas";
import type { RegisterEntry, RegisterSummary } from "./domain/entities";
import { prismaRegisterRepository } from "./infrastructure/prisma-register-repository";

const dependencies = {
  register: prismaRegisterRepository,
  audit: auditService.record,
};

/** Composition root for the control register module. */
export const registerService = {
  list: async (
    organizationId: string,
    query: RegisterQuery,
  ): Promise<Result<Paginated<RegisterEntry>>> =>
    success(await prismaRegisterRepository.list(organizationId, query)),

  summarise: async (organizationId: string): Promise<Result<RegisterSummary>> =>
    success(await prismaRegisterRepository.summarise(organizationId)),

  findByControl: (organizationId: string, controlId: string) =>
    prismaRegisterRepository.findByControl(organizationId, controlId),

  listApplicableControlIds: (organizationId: string, frameworkId: string) =>
    prismaRegisterRepository.listApplicableControlIds(organizationId, frameworkId),

  implementationStatusFor: (organizationId: string, controlId: string) =>
    prismaRegisterRepository.implementationStatusFor(organizationId, controlId),

  update: updateRegisterEntry(dependencies),
  synchronise: synchroniseRegister(dependencies),
};

export type {
  Applicability,
  ImplementationStatus,
  RegisterEntry,
  RegisterSummary,
} from "./domain/entities";
