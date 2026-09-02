import { auditService } from "@/modules/audit";
import type { RemediationPlanner } from "@/modules/gap/application/ports/remediation-planner";
import { registerService } from "@/modules/register";
import { success, type Result } from "@/shared/core/result";
import type { Paginated } from "@/shared/core/pagination";

import { addComment } from "./application/use-cases/add-comment";
import { createAction } from "./application/use-cases/create-action";
import { ensureActionForGap } from "./application/use-cases/ensure-action-for-gap";
import { updateAction } from "./application/use-cases/update-action";
import type { RemediationQuery } from "./application/schemas";
import type { RemediationAction, RemediationSummary } from "./domain/entities";
import { prismaRemediationRepository } from "./infrastructure/prisma-remediation-repository";

const controlOwnerId = async (organizationId: string, controlId: string) => {
  const entry = await registerService.findByControl(organizationId, controlId);
  return entry?.ownerId ?? null;
};

const dependencies = {
  actions: prismaRemediationRepository,
  audit: auditService.record,
  controlOwnerId,
};

/** Composition root for remediation planning and tracking. */
export const remediationService = {
  list: async (
    organizationId: string,
    query: RemediationQuery,
  ): Promise<Result<Paginated<RemediationAction>>> =>
    success(await prismaRemediationRepository.list(organizationId, query)),

  findById: (id: string) => prismaRemediationRepository.findById(id),

  summarise: async (organizationId: string): Promise<Result<RemediationSummary>> =>
    success(await prismaRemediationRepository.summarise(organizationId)),

  create: createAction(dependencies),
  update: updateAction(dependencies),
  comment: addComment(dependencies),
};

/**
 * The gap module drives remediation through this port, so it never has to know
 * how actions are numbered, scheduled or stored.
 */
export const remediationPlanner: RemediationPlanner = {
  ensureActionForGap: ensureActionForGap(dependencies),
  onGapAwaitingReview: (gapId) => prismaRemediationRepository.moveOpenActionsToReview(gapId),
  countOpenActions: (gapId) => prismaRemediationRepository.countOpenByGap(gapId),
};

export type {
  Priority,
  RemediationAction,
  RemediationStatus,
  RemediationSummary,
} from "./domain/entities";
export { isOverdue } from "./domain/entities";
