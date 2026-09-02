import type { AuditDraft } from "@/modules/audit";
import { ValidationError } from "@/shared/core/errors";
import { failure, success, type Result } from "@/shared/core/result";

import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES, type Evidence } from "../../domain/entities";
import type { EvidenceRepository } from "../ports/evidence-repository";
import type { FileStorage } from "../ports/file-storage";
import type { CreateEvidenceInput } from "../schemas";

interface Dependencies {
  readonly evidence: EvidenceRepository;
  readonly storage: FileStorage;
  readonly audit: (draft: AuditDraft) => Promise<void>;
}

interface Command {
  readonly actor: { id: string; email: string; fullName: string };
  readonly organizationId: string;
  readonly input: CreateEvidenceInput;
  readonly file: File | null;
}

export const addEvidence =
  ({ evidence, storage, audit }: Dependencies) =>
  async ({ actor, organizationId, input, file }: Command): Promise<Result<Evidence>> => {
    let stored = null;

    if (input.kind === "DOCUMENT") {
      if (!file || file.size === 0) {
        return failure(
          new ValidationError("Choose a file to upload.", [
            { field: "file", message: "A document is required." },
          ]),
        );
      }

      if (file.size > MAX_FILE_BYTES) {
        return failure(
          new ValidationError("The file is larger than the 15 MB limit.", [
            { field: "file", message: "Upload a file of 15 MB or less." },
          ]),
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
        return failure(
          new ValidationError("That file type is not accepted.", [
            { field: "file", message: "Upload a PDF, Office document, text file or image." },
          ]),
        );
      }

      stored = await storage.save(file);
    }

    const record = await evidence.create({
      organizationId,
      title: input.title,
      description: input.description?.trim() || null,
      kind: input.kind,
      url: input.kind === "LINK" ? (input.url ?? null) : null,
      fileName: stored?.fileName ?? null,
      storedFileName: stored?.storedFileName ?? null,
      mimeType: stored?.mimeType ?? null,
      fileSize: stored?.fileSize ?? null,
      uploadedById: actor.id,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      target: {
        controlId: input.controlId,
        assessmentItemId: input.assessmentItemId,
        gapId: input.gapId,
        remediationId: input.remediationId,
      },
    });

    await audit({
      actor,
      action: "CREATE",
      entityType: "Evidence",
      entityId: record.id,
      summary: `Evidence added: ${record.title}`,
    });

    return success(record);
  };
