import { z } from "zod";

import { PERMISSIONS } from "../domain/permissions";

export const signInSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Enter your password."),
});

export type SignInInput = z.infer<typeof signInSchema>;

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const createUserSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  fullName: z.string().trim().min(2, "Enter the full name."),
  jobTitle: z.string().trim().max(120).optional().nullable(),
  password: passwordSchema,
  roleId: z.string().min(1, "Select a role."),
  siteId: z.string().cuid().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter the full name.").optional(),
    jobTitle: z.string().trim().max(120).nullable().optional(),
    roleId: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    siteId: z.string().cuid().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

const permissionListSchema = z
  .array(z.enum(PERMISSIONS))
  .min(1, "Select at least one permission.");

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, "Give the role a name.").max(80),
  description: z.string().trim().max(280).optional().nullable(),
  permissions: permissionListSchema,
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(2, "Give the role a name.").max(80).optional(),
    description: z.string().trim().max(280).nullable().optional(),
    permissions: permissionListSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
