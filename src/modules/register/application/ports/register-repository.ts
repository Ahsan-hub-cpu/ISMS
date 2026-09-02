import type { Paginated } from "@/shared/core/pagination";

import type { ImplementationStatus, RegisterEntry, RegisterSummary } from "../../domain/entities";
import type { RegisterQuery, UpdateRegisterEntryInput } from "../schemas";

export interface RegisterRepository {
  list(organizationId: string, query: RegisterQuery): Promise<Paginated<RegisterEntry>>;
  findById(id: string): Promise<RegisterEntry | null>;
  findByControl(organizationId: string, controlId: string): Promise<RegisterEntry | null>;
  update(id: string, changes: UpdateRegisterEntryInput): Promise<RegisterEntry>;
  summarise(organizationId: string): Promise<RegisterSummary>;
  /** Creates entries for catalogue controls that are not in the register yet. */
  createMissingEntries(organizationId: string, frameworkId: string): Promise<number>;
  listApplicableControlIds(organizationId: string, frameworkId: string): Promise<string[]>;
  implementationStatusFor(
    organizationId: string,
    controlId: string,
  ): Promise<ImplementationStatus | null>;
}
