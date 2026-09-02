import { z } from "zod";

import { paginationSchema } from "@/shared/core/pagination";

import { APPLICABILITIES, IMPLEMENTATION_STATUSES } from "../domain/entities";

export const registerQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  themeCode: z.string().trim().max(16).optional(),
  status: z.enum(IMPLEMENTATION_STATUSES).optional(),
  applicability: z.enum(APPLICABILITIES).optional(),
  ownerId: z.string().optional(),
  unassignedOnly: z.coerce.boolean().optional(),
});

export type RegisterQuery = z.infer<typeof registerQuerySchema>;

export const updateRegisterEntrySchema = z
  .object({
    ownerId: z.string().nullable().optional(),
    siteId: z.string().nullable().optional(),
    applicability: z.enum(APPLICABILITIES).optional(),
    justification: z.string().trim().max(1000).nullable().optional(),
    implementationStatus: z.enum(IMPLEMENTATION_STATUSES).optional(),
    implementationNotes: z.string().trim().max(2000).nullable().optional(),
    reviewDueAt: z.iso.date().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type UpdateRegisterEntryInput = z.infer<typeof updateRegisterEntrySchema>;
