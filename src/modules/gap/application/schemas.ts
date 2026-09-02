import { z } from "zod";

import { paginationSchema } from "@/shared/core/pagination";

import { GAP_STATUSES } from "../domain/entities";
import { RISK_RATINGS } from "../domain/risk";

export const gapQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  status: z.enum(GAP_STATUSES).optional(),
  riskRating: z.enum(RISK_RATINGS).optional(),
  assessmentId: z.string().optional(),
  outstandingOnly: z.coerce.boolean().optional(),
});

export type GapQuery = z.infer<typeof gapQuerySchema>;

export const updateGapSchema = z
  .object({
    /**
     * The generated wording is a draft. An assessor may replace it, and the
     * confirmed text is what reports and the audit trail then refer to.
     */
    description: z.string().trim().min(20, "Describe the gap in a sentence or two.").optional(),
    recommendation: z.string().trim().min(10, "Describe what needs to be done.").optional(),
    riskRating: z.enum(RISK_RATINGS).optional(),
    status: z.enum(GAP_STATUSES).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type UpdateGapInput = z.infer<typeof updateGapSchema>;
