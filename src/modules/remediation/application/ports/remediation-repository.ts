import type { Paginated } from "@/shared/core/pagination";

import type { Priority, RemediationAction, RemediationSummary } from "../../domain/entities";
import type { RemediationQuery, UpdateRemediationInput } from "../schemas";

export interface NewAction {
  readonly organizationId: string;
  readonly reference: string;
  readonly title: string;
  readonly description: string;
  readonly gapId: string | null;
  readonly controlId: string | null;
  readonly ownerId: string | null;
  readonly priority: Priority;
  readonly dueAt: Date | null;
  readonly createdById: string | null;
}

export interface RemediationRepository {
  nextReference(organizationId: string): Promise<string>;
  create(data: NewAction): Promise<RemediationAction>;
  findById(id: string): Promise<RemediationAction | null>;
  findOpenByGap(gapId: string): Promise<RemediationAction | null>;
  countOpenByGap(gapId: string): Promise<number>;
  /** Evidence attached to the action that an assessor has not reviewed yet. */
  countPendingEvidence(actionId: string): Promise<number>;
  list(organizationId: string, query: RemediationQuery): Promise<Paginated<RemediationAction>>;
  update(id: string, changes: UpdateRemediationInput, completedAt: Date | null): Promise<RemediationAction>;
  moveOpenActionsToReview(gapId: string): Promise<void>;
  addComment(actionId: string, authorId: string | null, body: string): Promise<void>;
  summarise(organizationId: string): Promise<RemediationSummary>;
}
