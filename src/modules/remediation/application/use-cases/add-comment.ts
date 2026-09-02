import type { AuditDraft } from "@/modules/audit";
import { NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { RemediationAction } from "../../domain/entities";
import type { RemediationRepository } from "../ports/remediation-repository";

interface Dependencies {
  readonly actions: RemediationRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly actionId: string;
  readonly body: string;
}

export const addComment =
  ({ actions, audit }: Dependencies) =>
  async ({ actor, actionId, body }: Command): Promise<Result<RemediationAction>> => {
    const existing = await actions.findById(actionId);
    if (!existing) {
      return failure(new NotFoundError("Remediation action", actionId));
    }

    await actions.addComment(actionId, actor.id, body);

    await audit({
      actor,
      action: "UPDATE",
      entityType: "RemediationAction",
      entityId: actionId,
      summary: `Comment added to ${existing.reference}`,
    });

    const refreshed = await actions.findById(actionId);
    return success(refreshed ?? existing);
  };
