import { auditService } from "@/modules/audit";
import { prismaRemediationRepository } from "@/modules/remediation/infrastructure/prisma-remediation-repository";
import { success, type Result } from "@/shared/core/result";
import type { Paginated } from "@/shared/core/pagination";

import { addEvidence } from "./application/use-cases/add-evidence";
import { removeEvidence } from "./application/use-cases/remove-evidence";
import { reviewEvidence } from "./application/use-cases/review-evidence";
import type { EvidenceQuery, EvidenceTarget } from "./application/schemas";
import type { Evidence, EvidenceSummary } from "./domain/entities";
import { localFileStorage } from "./infrastructure/local-file-storage";
import { prismaEvidenceRepository } from "./infrastructure/prisma-evidence-repository";

const dependencies = {
  evidence: prismaEvidenceRepository,
  storage: localFileStorage,
  audit: auditService.record,
  completeRemediationWhenClear: (actionId: string) =>
    prismaRemediationRepository.completeWhenEvidenceCleared(actionId),
};

/** Composition root for the evidence module. */
export const evidenceService = {
  list: async (
    organizationId: string,
    query: EvidenceQuery,
  ): Promise<Result<Paginated<Evidence>>> =>
    success(await prismaEvidenceRepository.list(organizationId, query)),

  findById: (id: string) => prismaEvidenceRepository.findById(id),

  summarise: async (organizationId: string): Promise<Result<EvidenceSummary>> =>
    success(await prismaEvidenceRepository.summarise(organizationId)),

  add: addEvidence(dependencies),
  review: reviewEvidence(dependencies),
  remove: removeEvidence(dependencies),

  link: async (evidenceId: string, target: EvidenceTarget): Promise<Result<Evidence>> =>
    success(await prismaEvidenceRepository.addLink(evidenceId, target)),

  unlink: (linkId: string) => prismaEvidenceRepository.removeLink(linkId),

  /** Used by the authenticated download route. */
  readFile: async (id: string) => {
    const record = await prismaEvidenceRepository.findById(id);
    const storedFileName = await prismaEvidenceRepository.storedFileNameOf(id);
    if (!record || !storedFileName) return null;

    return {
      body: await localFileStorage.read(storedFileName),
      fileName: record.fileName ?? "evidence",
      mimeType: record.mimeType ?? "application/octet-stream",
    };
  },
};

export type { Evidence, EvidenceKind, EvidenceSummary } from "./domain/entities";
export {
  EVIDENCE_KIND_LABELS,
  EVIDENCE_KINDS,
  EVIDENCE_REVIEW_LABELS,
  EVIDENCE_REVIEW_STATUSES,
  formatFileSize,
  isExpired,
} from "./domain/entities";
