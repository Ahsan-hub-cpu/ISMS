import type { Paginated } from "@/shared/core/pagination";

import type {
  Evidence,
  EvidenceKind,
  EvidenceReviewStatus,
  EvidenceSummary,
} from "../../domain/entities";
import type { EvidenceQuery, EvidenceTarget } from "../schemas";

export interface NewEvidence {
  readonly organizationId: string;
  readonly title: string;
  readonly description: string | null;
  readonly kind: EvidenceKind;
  readonly url: string | null;
  readonly fileName: string | null;
  readonly storedFileName: string | null;
  readonly mimeType: string | null;
  readonly fileSize: number | null;
  readonly uploadedById: string;
  readonly validUntil: Date | null;
  readonly target: EvidenceTarget;
}

export interface EvidenceRepository {
  create(data: NewEvidence): Promise<Evidence>;
  list(organizationId: string, query: EvidenceQuery): Promise<Paginated<Evidence>>;
  findById(id: string): Promise<Evidence | null>;
  storedFileNameOf(id: string): Promise<string | null>;
  addLink(evidenceId: string, target: EvidenceTarget): Promise<Evidence>;
  removeLink(linkId: string): Promise<void>;
  review(
    id: string,
    status: EvidenceReviewStatus,
    note: string | null,
    reviewerId: string,
  ): Promise<Evidence>;
  remove(id: string): Promise<void>;
  summarise(organizationId: string): Promise<EvidenceSummary>;
}
