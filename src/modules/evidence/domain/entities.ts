export const EVIDENCE_KINDS = ["DOCUMENT", "LINK"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_REVIEW_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type EvidenceReviewStatus = (typeof EVIDENCE_REVIEW_STATUSES)[number];

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  DOCUMENT: "Document",
  LINK: "Link",
};

export const EVIDENCE_REVIEW_LABELS: Record<EvidenceReviewStatus, string> = {
  PENDING: "Awaiting review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

/** What a piece of evidence is attached to. */
export interface EvidenceLink {
  readonly id: string;
  readonly controlId: string | null;
  readonly controlCode: string | null;
  readonly assessmentItemId: string | null;
  readonly gapId: string | null;
  readonly gapReference: string | null;
  readonly remediationId: string | null;
  readonly remediationReference: string | null;
}

export interface Evidence {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly kind: EvidenceKind;
  readonly url: string | null;
  readonly fileName: string | null;
  readonly mimeType: string | null;
  readonly fileSize: number | null;
  readonly uploadedByName: string | null;
  readonly reviewStatus: EvidenceReviewStatus;
  readonly reviewNote: string | null;
  readonly reviewedByName: string | null;
  readonly reviewedAt: Date | null;
  readonly validUntil: Date | null;
  readonly createdAt: Date;
  readonly links: readonly EvidenceLink[];
}

export interface EvidenceSummary {
  readonly total: number;
  readonly pending: number;
  readonly accepted: number;
  readonly rejected: number;
  readonly expired: number;
}

export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
] as const;

export const isExpired = (evidence: Pick<Evidence, "validUntil">, now = new Date()) =>
  evidence.validUntil !== null && evidence.validUntil < now;

export const formatFileSize = (bytes: number | null): string => {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
