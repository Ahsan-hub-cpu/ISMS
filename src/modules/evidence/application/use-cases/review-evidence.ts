import type { AuditDraft } from "@/modules/audit";
import { NotFoundError, ValidationError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { Evidence } from "../../domain/entities";
import type { EvidenceRepository } from "../ports/evidence-repository";
import type { ReviewEvidenceInput } from "../schemas";

interface Dependencies {
  readonly evidence: EvidenceRepository;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly evidenceId: string;
  readonly input: ReviewEvidenceInput;
}

export const reviewEvidence =
  ({ evidence, audit }: Dependencies) =>
  async ({ actor, evidenceId, input }: Command): Promise<Result<Evidence>> => {
    const existing = await evidence.findById(evidenceId);
    if (!existing) {
      return failure(new NotFoundError("Evidence", evidenceId));
    }

    // A rejection has to say what was wrong, otherwise the uploader cannot act on it.
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

    return success(updated);
  };
