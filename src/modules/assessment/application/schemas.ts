import { z } from "zod";

import { paginationSchema } from "@/shared/core/pagination";

import { ASSESSMENT_STATUSES, COMPLIANCE_STATUSES } from "../domain/entities";

export const assessmentQuerySchema = paginationSchema.extend({
  status: z.enum(ASSESSMENT_STATUSES).optional(),
  search: z.string().trim().max(120).optional(),
});

export type AssessmentQuery = z.infer<typeof assessmentQuerySchema>;

export const createAssessmentSchema = z.object({
  title: z.string().trim().min(5, "Give the assessment a recognisable title."),
  scope: z.string().trim().min(10, "Describe what this assessment covers."),
  frameworkCode: z.string().trim().min(2),
  leadAssessorId: z.string().min(1, "Select a lead assessor."),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const assessmentItemQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  themeCode: z.string().trim().max(16).optional(),
  status: z.enum(COMPLIANCE_STATUSES).optional(),
  pendingOnly: z.coerce.boolean().optional(),
});

export type AssessmentItemQuery = z.infer<typeof assessmentItemQuerySchema>;

export const recordFindingSchema = z
  .object({
    status: z.enum(COMPLIANCE_STATUSES).exclude(["NOT_ASSESSED"]),
    currentPractice: z.string().trim().max(2000).optional(),
    rationale: z.string().trim().max(2000).optional(),
  })
  .refine(
    (value) =>
      value.status === "COMPLIANT" ||
      value.status === "NOT_APPLICABLE" ||
      Boolean(value.currentPractice?.trim()),
    {
      path: ["currentPractice"],
      message: "Describe current practice so the gap can be documented.",
    },
  );

export type RecordFindingInput = z.infer<typeof recordFindingSchema>;
