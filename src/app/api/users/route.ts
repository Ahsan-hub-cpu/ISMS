import { authService } from "@/modules/auth";
import { createUserSchema } from "@/modules/auth/application/schemas";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

export const GET = withApiHandler(async () => {
  await requirePermission("users:read");
  return respond(await authService.listUsers());
});

export const POST = withApiHandler(async (request: Request) => {
  await requirePermission("users:manage");
  const input = await parseJsonBody(request, createUserSchema);
  return respond(await authService.createUser(input), 201);
});
