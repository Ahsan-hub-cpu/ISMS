import type { AuditDraft } from "@/modules/audit";
import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import { COMPLIANCE_STATUS_LABELS, isEditable, type AssessmentItem } from "../../domain/entities";
import type { AssessmentRepository } from "../ports/assessment-repository";
import type { GapSynchronizer } from "../ports/gap-synchronizer";
import type { RecordFindingInput } from "../schemas";

interface Dependencies {
  readonly assessments: AssessmentRepository;
  readonly synchroniseGap: GapSynchronizer;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly organizationId: string;
  readonly itemId: string;
  readonly input: RecordFindingInput;
}

/**
 * Records what the assessor found for one control. This is the only judgement a
 * person makes; identifying the gap, rating its risk and raising the remediation
 * action all follow automatically from it.
 */
export const recordFinding =
  ({ assessments, synchroniseGap, audit }: Dependencies) =>
  async ({ actor, organizationId, itemId, input }: Command): Promise<Result<AssessmentItem>> => {
    const existing = await assessments.findItem(itemId);
    if (!existing) {
      return failure(new NotFoundError("Assessment item", itemId));
    }

    if (!isEditable(existing.assessmentStatus)) {
      return failure(
        new ConflictError("This assessment has been submitted and can no longer be edited."),
      );
    }

    const item = await assessments.recordFinding(itemId, input, actor.id);

    await synchroniseGap({
      actor,
      organizationId,
      assessmentId: item.assessmentId,
      assessmentItemId: item.id,
      controlId: item.controlId,
      complianceStatus: item.status,
      currentPractice: item.currentPractice,
    });

    await audit({
      actor,
      action: "REVIEW",
      entityType: "AssessmentItem",
      entityId: item.id,
      summary: `${item.controlCode} assessed as ${COMPLIANCE_STATUS_LABELS[item.status].toLowerCase()}`,
    });

    // The finding may have raised or closed a gap, so read the item back with
    // its current gap reference.
    const refreshed = await assessments.findItem(itemId);
    return success(refreshed ?? item);
  };
