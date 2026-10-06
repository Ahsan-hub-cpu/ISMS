import type { AuditDraft } from "@/modules/audit";
import { notifyUsers, userIdsWithPermission } from "@/modules/notifications";
import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import { isClosed, progressForStatus, type RemediationAction } from "../../domain/entities";
import type { RemediationRepository } from "../ports/remediation-repository";
import type { UpdateRemediationInput } from "../schemas";

interface Dependencies {
  readonly actions: RemediationRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly actionId: string;
  readonly changes: UpdateRemediationInput;
}

export const updateAction =
  ({ actions, audit }: Dependencies) =>
  async ({ actor, actionId, changes }: Command): Promise<Result<RemediationAction>> => {
    const existing = await actions.findById(actionId);
    if (!existing) {
      return failure(new NotFoundError("Remediation action", actionId));
    }

    let status = changes.status ?? existing.status;
    const requestedProgress = changes.progressPercent ?? existing.progressPercent;

    const markingReadyForReview =
      (requestedProgress >= 100 || status === "IN_REVIEW") &&
      existing.status !== "IN_REVIEW" &&
      existing.status !== "COMPLETED" &&
      existing.status !== "CANCELLED";

    if (markingReadyForReview && existing.evidenceCount === 0) {
      return failure(
        new ConflictError(
          "Attach at least one piece of evidence before setting progress to 100% or moving to In review.",
        ),
      );
    }

    // 100% from the owner means "I am done — please review", not silent complete.
    if (
      requestedProgress >= 100 &&
      (status === "OPEN" || status === "IN_PROGRESS") &&
      (!changes.status || changes.status === "OPEN" || changes.status === "IN_PROGRESS")
    ) {
      status = "IN_REVIEW";
    }

    // Marking work done is not the same as proving it. Evidence attached to the
    // action has to be reviewed before the action can be called complete.
    if (status === "COMPLETED" && existing.status !== "COMPLETED") {
      const pending = await actions.countPendingEvidence(actionId);
      if (pending > 0) {
        return failure(
          new ConflictError(
            pending === 1
              ? "1 piece of evidence on this action still awaits assessor review."
              : `${pending} pieces of evidence on this action still await assessor review.`,
          ),
        );
      }
    }

    const progressPercent = progressForStatus(status, requestedProgress);

    const updated = await actions.update(
      actionId,
      { ...changes, status, progressPercent },
      isClosed(status) ? (existing.completedAt ?? new Date()) : null,
    );

    await audit({
      actor,
      action: "UPDATE",
      entityType: "RemediationAction",
      entityId: actionId,
      summary:
        status !== existing.status
          ? `${existing.reference} moved from ${existing.status} to ${status}`
          : `${existing.reference} updated`,
    });

    if (status === "IN_REVIEW" && existing.status !== "IN_REVIEW") {
      const reviewerIds = await userIdsWithPermission("evidence:review", {
        excludeUserId: actor.id,
      });
      await notifyUsers(
        reviewerIds.map((userId) => ({
          userId,
          title: "Your turn — remediation ready for review",
          body: `${actor.fullName} marked ${existing.reference} as ready for review (${existing.title}).`,
          href: `/remediation/${actionId}`,
        })),
      );
    }

    return success(updated);
  };
