import { success, type Result } from "@/shared/core/result";
import type { Paginated } from "@/shared/core/pagination";

import type { AuditFilter } from "./application/ports/audit-repository";
import type { AuditDraft, AuditEntry } from "./domain/entities";
import { prismaAuditRepository } from "./infrastructure/prisma-audit-repository";

/**
 * Composition root for the audit trail. Other modules call `record` after a
 * change succeeds; a failure to write history must never fail the operation
 * itself, so the error is logged rather than propagated.
 */
export const auditService = {
  async record(draft: AuditDraft): Promise<void> {
    try {
      await prismaAuditRepository.record(draft);
    } catch (error) {
      console.error("[audit] Failed to record entry", { entityType: draft.entityType, error });
    }
  },

  async list(filter: AuditFilter): Promise<Result<Paginated<AuditEntry>>> {
    return success(await prismaAuditRepository.list(filter));
  },

  listEntityTypes: () => prismaAuditRepository.listEntityTypes(),
};

export type { AuditAction, AuditDraft, AuditEntry } from "./domain/entities";
export { AUDIT_ACTION_LABELS, AUDIT_ACTIONS } from "./domain/entities";
