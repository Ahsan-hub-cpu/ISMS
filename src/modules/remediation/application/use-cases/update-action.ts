import type { AuditDraft } from "@/modules/audit";
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

    const status = changes.status ?? existing.status;

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

    const progressPercent = progressForStatus(
      status,
      changes.progressPercent ?? existing.progressPercent,
    );

    const updated = await actions.update(
      actionId,
      { ...changes, progressPercent },
      isClosed(status) ? (existing.completedAt ?? new Date()) : null,
    );

    await audit({
      actor,
      action: "UPDATE",
      entityType: "RemediationAction",
      entityId: actionId,
      summary:
        changes.status && changes.status !== existing.status
          ? `${existing.reference} moved from ${existing.status} to ${changes.status}`
          : `${existing.reference} updated`,
    });

    return success(updated);
  };
