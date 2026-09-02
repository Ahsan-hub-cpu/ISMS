import { z } from "zod";

import { paginationSchema } from "@/shared/core/pagination";

import {
  CONTROL_TYPES,
  CYBERSECURITY_CONCEPTS,
  SECURITY_PROPERTIES,
} from "../domain/attributes";

/** Query contract for browsing the control catalogue. */
export const controlQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  themeCode: z.string().trim().max(16).optional(),
  controlType: z.enum(CONTROL_TYPES).optional(),
  securityProperty: z.enum(SECURITY_PROPERTIES).optional(),
  cybersecurityConcept: z.enum(CYBERSECURITY_CONCEPTS).optional(),
});

export type ControlQuery = z.infer<typeof controlQuerySchema>;
