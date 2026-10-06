import type { AuditDraft } from "@/modules/audit";
import { NotFoundError, ValidationError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { Evidence } from "../../domain/entities";
import type { EvidenceRepository } from "../ports/evidence-repository";
import type { ReviewEvidenceInput } from "../schemas";

interface Dependencies {
  readonly evidence: EvidenceRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
  /** Completes linked remediation actions once no pending evidence remains. */
  readonly completeRemediationWhenClear: (actionId: string) => Promise<boolean>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly evidenceId: string;
  readonly input: ReviewEvidenceInput;
}

export const reviewEvidence =
  ({ evidence, audit, completeRemediationWhenClear }: Dependencies) =>
  async ({ actor, evidenceId, input }: Command): Promise<Result<Evidence>> => {
    const existing = await evidence.findById(evidenceId);
    if (!existing) {
      return failure(new NotFoundError("Evidence", evidenceId));
    }

    if (input.reviewStatus === "REJECTED" && !input.reviewNote?.trim()) {
      return failure(
        new ValidationError("Explain why the evidence was rejected.", [
          { field: "reviewNote", message: "A reason is required when rejecting evidence." },
        ]),
      );
    }

    const updated = await evidence.review(
      evidenceId,
      input.reviewStatus,
      input.reviewNote?.trim() || null,
      actor.id,
    );

    await audit({
      actor,
      action: "REVIEW",
      entityType: "Evidence",
      entityId: evidenceId,
      summary: `Evidence "${existing.title}" ${input.reviewStatus.toLowerCase()}`,
    });

    if (input.reviewStatus === "ACCEPTED") {
      const remediationIds = [
        ...new Set(
          updated.links
            .map((link) => link.remediationId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      for (const actionId of remediationIds) {
        const completed = await completeRemediationWhenClear(actionId);
        if (completed) {
          await audit({
            actor,
            action: "UPDATE",
            entityType: "RemediationAction",
            entityId: actionId,
            summary: `Remediation marked completed after evidence "${existing.title}" was accepted`,
          });
        }
      }
    }

    return success(updated);
  };
