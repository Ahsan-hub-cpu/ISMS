import type { AuditDraft } from "@/modules/audit";
import { success, type Result } from "@/shared/core/result";

import type { RemediationAction } from "../../domain/entities";
import type { RemediationRepository } from "../ports/remediation-repository";
import type { CreateRemediationInput } from "../schemas";

interface Dependencies {
  readonly actions: RemediationRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly organizationId: string;
  readonly input: CreateRemediationInput;
}

/** For improvement work that is not tied to an automatically identified gap. */
export const createAction =
  ({ actions, audit }: Dependencies) =>
  async ({ actor, organizationId, input }: Command): Promise<Result<RemediationAction>> => {
    const action = await actions.create({
      organizationId,
      reference: await actions.nextReference(organizationId),
      title: input.title,
      description: input.description,
      gapId: input.gapId ?? null,
      controlId: input.controlId ?? null,
      ownerId: input.ownerId ?? null,
      priority: input.priority,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      createdById: actor.id,
    });

    await audit({
      actor,
      action: "CREATE",
      entityType: "RemediationAction",
      entityId: action.id,
      summary: `${action.reference} created: ${action.title}`,
    });

    return success(action);
  };
