import type { Paginated, PaginationParams } from "@/shared/core/pagination";

import type { AuditDraft, AuditEntry } from "../../domain/entities";

export interface AuditFilter extends PaginationParams {
  readonly entityType?: string;
  readonly actorId?: string;
}

export interface AuditRepository {
  record(draft: AuditDraft): Promise<void>;
  list(filter: AuditFilter): Promise<Paginated<AuditEntry>>;
  listEntityTypes(): Promise<string[]>;
}
