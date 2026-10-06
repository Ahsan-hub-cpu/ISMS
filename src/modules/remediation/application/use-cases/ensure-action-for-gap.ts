import type { AuditDraft } from "@/modules/audit";
import type { PlannedAction } from "@/modules/gap/application/ports/remediation-planner";
import { notifyUsers } from "@/modules/notifications";

import {
  actionTitleForGap,
  dueDateFromRisk,
  priorityFromRisk,
  slaDays,
} from "../../domain/planning";
import type { RemediationRepository } from "../ports/remediation-repository";

interface Dependencies {
  readonly actions: RemediationRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
  readonly controlOwnerId: (organizationId: string, controlId: string) => Promise<string | null>;
}

export const ensureActionForGap =
  ({ actions, audit, controlOwnerId }: Dependencies) =>
  async (plan: PlannedAction): Promise<void> => {
    const existing = await actions.findOpenByGap(plan.gapId);
    if (existing) return;

    const priority = priorityFromRisk[plan.riskRating];
    const dueAt = dueDateFromRisk(plan.riskRating);
    const ownerId = await controlOwnerId(plan.organizationId, plan.controlId);

    const action = await actions.create({
      organizationId: plan.organizationId,
      reference: await actions.nextReference(plan.organizationId),
      title: actionTitleForGap(plan.controlCode, plan.controlTitle),
      description: plan.recommendation,
      gapId: plan.gapId,
      controlId: plan.controlId,
      ownerId,
      priority,
      dueAt,
      createdById: plan.actor?.id ?? null,
    });

    await audit({
      actor: plan.actor,
      action: "CREATE",
      entityType: "RemediationAction",
      entityId: action.id,
      summary: `${action.reference} raised for ${plan.gapReference} with ${priority.toLowerCase()} priority, due ${dueAt.toISOString().slice(0, 10)} under the internal ${slaDays[plan.riskRating]}-day remediation SLA`,
    });

    if (ownerId) {
      await notifyUsers([
        {
          userId: ownerId,
          title: "Your turn — fix this gap",
          body: `${plan.gapReference}: ${plan.controlCode} needs remediation and evidence.`,
          href: `/gaps/${plan.gapId}`,
        },
      ]);
    }
  };
