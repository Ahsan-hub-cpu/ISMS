import { authService } from "@/modules/auth";
import { createRoleSchema } from "@/modules/auth/application/schemas";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { jsonOk, parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

export const GET = withApiHandler(async () => {
  await requirePermission("users:manage");
  return jsonOk(await authService.listRoles());
});

export const POST = withApiHandler(async (request: Request) => {
  const actor = await requirePermission("users:manage");
  const input = await parseJsonBody(request, createRoleSchema);
  return respond(await authService.createRole({ actor, input }), 201);
});
