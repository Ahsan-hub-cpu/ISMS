import { z } from "zod";

import { paginationSchema } from "@/shared/core/pagination";

import { PRIORITIES, REMEDIATION_STATUSES } from "../domain/entities";

export const remediationQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  status: z.enum(REMEDIATION_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  ownerId: z.string().optional(),
  gapId: z.string().optional(),
  overdueOnly: z.coerce.boolean().optional(),
});

export type RemediationQuery = z.infer<typeof remediationQuerySchema>;

export const createRemediationSchema = z.object({
  title: z.string().trim().min(5, "Give the action a clear title."),
  description: z.string().trim().min(10, "Describe what has to be done."),
  controlId: z.string().nullable().optional(),
  gapId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  dueAt: z.iso.date().nullable().optional(),
});

export type CreateRemediationInput = z.infer<typeof createRemediationSchema>;

export const updateRemediationSchema = z
  .object({
    title: z.string().trim().min(5).optional(),
    description: z.string().trim().min(10).optional(),
    ownerId: z.string().nullable().optional(),
    priority: z.enum(PRIORITIES).optional(),
    status: z.enum(REMEDIATION_STATUSES).optional(),
    progressPercent: z.coerce.number().int().min(0).max(100).optional(),
    dueAt: z.iso.date().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type UpdateRemediationInput = z.infer<typeof updateRemediationSchema>;

export const addCommentSchema = z.object({
  body: z.string().trim().min(2, "Write a comment.").max(2000),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;
