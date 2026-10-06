import type { AuditDraft } from "@/modules/audit";
import { notifyUsers, userIdsWithPermission } from "@/modules/notifications";
import { ConflictError, NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { Assessment, AssessmentStatus } from "../../domain/entities";
import type { AssessmentRepository } from "../ports/assessment-repository";

interface Dependencies {
  readonly assessments: AssessmentRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly assessmentId: string;
  readonly target: Extract<AssessmentStatus, "SUBMITTED" | "APPROVED">;
}

const ALLOWED_FROM: Record<Command["target"], readonly AssessmentStatus[]> = {
  SUBMITTED: ["DRAFT", "IN_PROGRESS"],
  APPROVED: ["SUBMITTED"],
};

export const changeAssessmentStatus =
  ({ assessments, audit }: Dependencies) =>
  async ({ actor, assessmentId, target }: Command): Promise<Result<Assessment>> => {
    const existing = await assessments.findById(assessmentId);
    if (!existing) {
      return failure(new NotFoundError("Assessment", assessmentId));
    }

    if (!ALLOWED_FROM[target].includes(existing.status)) {
      return failure(
        new ConflictError(`An assessment that is ${existing.status} cannot be moved to ${target}.`),
      );
    }

    if (target === "SUBMITTED") {
      const remaining = await assessments.countUnassessed(assessmentId);
      if (remaining > 0) {
        return failure(
          new ConflictError(
            `${remaining} control${remaining === 1 ? " has" : "s have"} not been assessed yet.`,
          ),
        );
      }
    }

    const updated = await assessments.setStatus(
      assessmentId,
      target,
      target === "APPROVED" ? actor.id : null,
    );

    await audit({
      actor,
      action: target === "APPROVED" ? "APPROVE" : "SUBMIT",
      entityType: "Assessment",
      entityId: assessmentId,
      summary: `${existing.reference} ${target === "APPROVED" ? "approved" : "submitted for approval"}`,
    });

    if (target === "SUBMITTED") {
      const approverIds = await userIdsWithPermission("assessments:approve", {
        excludeUserId: actor.id,
      });
      await notifyUsers(
        approverIds.map((userId) => ({
          userId,
          title: "Your turn — approve assessment",
          body: `${actor.fullName} submitted ${existing.reference} (${existing.title}). Review and Approve.`,
          href: `/assessments/${assessmentId}`,
        })),
      );
    }

    return success(updated);
  };
