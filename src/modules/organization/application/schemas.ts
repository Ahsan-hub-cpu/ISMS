import { z } from "zod";

export const createSiteSchema = z.object({
  name: z.string().trim().min(2, "Give the site a clear name.").max(120),
  code: z
    .string()
    .trim()
    .min(2, "Enter a short site code.")
    .max(16, "Keep the code to 16 characters or fewer.")
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens or underscores only.")
    .transform((value) => value.toUpperCase()),
  region: z.string().trim().max(120).optional().nullable(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
