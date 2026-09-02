import { z } from "zod";

import { paginationSchema } from "@/shared/core/pagination";

import { EVIDENCE_KINDS, EVIDENCE_REVIEW_STATUSES } from "../domain/entities";

export const evidenceQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  kind: z.enum(EVIDENCE_KINDS).optional(),
  reviewStatus: z.enum(EVIDENCE_REVIEW_STATUSES).optional(),
  controlId: z.string().optional(),
  gapId: z.string().optional(),
  remediationId: z.string().optional(),
  assessmentItemId: z.string().optional(),
});

export type EvidenceQuery = z.infer<typeof evidenceQuerySchema>;

/** Where a piece of evidence should be attached. At least one target is required. */
export const evidenceTargetSchema = z
  .object({
    controlId: z.string().optional(),
    assessmentItemId: z.string().optional(),
    gapId: z.string().optional(),
    remediationId: z.string().optional(),
  })
  .refine((value) => Object.values(value).some(Boolean), {
    message: "Attach the evidence to a control, finding, gap or remediation action.",
  });

export type EvidenceTarget = z.infer<typeof evidenceTargetSchema>;

export const createEvidenceSchema = z
  .object({
    title: z.string().trim().min(3, "Give the evidence a clear title."),
    description: z.string().trim().max(1000).optional(),
    kind: z.enum(EVIDENCE_KINDS),
    url: z.url("Enter a valid URL.").optional(),
    validUntil: z.iso.date().optional(),
    controlId: z.string().optional(),
    assessmentItemId: z.string().optional(),
    gapId: z.string().optional(),
    remediationId: z.string().optional(),
  })
  .refine((value) => value.kind !== "LINK" || Boolean(value.url), {
    path: ["url"],
    message: "A link needs a URL.",
  })
  .refine(
    (value) =>
      Boolean(value.controlId || value.assessmentItemId || value.gapId || value.remediationId),
    { message: "Attach the evidence to a control, finding, gap or remediation action." },
  );

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;

export const reviewEvidenceSchema = z
  .object({
    reviewStatus: z.enum(["ACCEPTED", "REJECTED"]),
    reviewNote: z.string().trim().max(1000).optional(),
  })
  // A rejection has to say what was wrong, otherwise the uploader cannot act on
  // it. The use case repeats this check so a malformed request cannot slip past.
  .refine((value) => value.reviewStatus !== "REJECTED" || Boolean(value.reviewNote?.trim()), {
    path: ["reviewNote"],
    message: "A reason is required when rejecting evidence.",
  });

export type ReviewEvidenceInput = z.infer<typeof reviewEvidenceSchema>;
