import type { AuditDraft } from "@/modules/audit";
import { NotFoundError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import type { EvidenceRepository } from "../ports/evidence-repository";
import type { FileStorage } from "../ports/file-storage";

interface Dependencies {
  readonly evidence: EvidenceRepository;
  readonly storage: FileStorage;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly evidenceId: string;
}

export const removeEvidence =
  ({ evidence, storage, audit }: Dependencies) =>
  async ({ actor, evidenceId }: Command): Promise<Result<{ id: string }>> => {
    const existing = await evidence.findById(evidenceId);
    if (!existing) {
      return failure(new NotFoundError("Evidence", evidenceId));
    }

    const storedFileName = await evidence.storedFileNameOf(evidenceId);
    await evidence.remove(evidenceId);

    if (storedFileName) {
      await storage.remove(storedFileName);
    }

    await audit({
      actor,
      action: "DELETE",
      entityType: "Evidence",
      entityId: evidenceId,
      summary: `Evidence removed: ${existing.title}`,
    });

    return success({ id: evidenceId });
  };
