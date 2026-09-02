import type { AuditDraft } from "@/modules/audit";
import type { PlannedAction } from "@/modules/gap/application/ports/remediation-planner";

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
  /** The control owner recorded in the register becomes the default action owner. */
  readonly controlOwnerId: (organizationId: string, controlId: string) => Promise<string | null>;
}

/**
 * Raises the remediation action that a newly identified gap needs. Priority and
 * due date come from the risk rating, so the plan is scheduled the moment the
 * gap appears rather than waiting for someone to fill in a form.
 *
 * The due date applies this project's internal remediation SLA (see
 * `src/config/risk-policy.ts`); ISO/IEC 27001 does not set deadlines.
 */
export const ensureActionForGap =
  ({ actions, audit, controlOwnerId }: Dependencies) =>
  async (plan: PlannedAction): Promise<void> => {
    const existing = await actions.findOpenByGap(plan.gapId);
    if (existing) return;

    const priority = priorityFromRisk[plan.riskRating];
    const dueAt = dueDateFromRisk(plan.riskRating);

    const action = await actions.create({
      organizationId: plan.organizationId,
      reference: await actions.nextReference(plan.organizationId),
      title: actionTitleForGap(plan.controlCode, plan.controlTitle),
      description: plan.recommendation,
      gapId: plan.gapId,
      controlId: plan.controlId,
      ownerId: await controlOwnerId(plan.organizationId, plan.controlId),
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
  };
