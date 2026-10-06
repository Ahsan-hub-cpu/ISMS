import { authService } from "@/modules/auth";
import { updateRoleSchema } from "@/modules/auth/application/schemas";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withApiHandler(async (request: Request, context: RouteContext) => {
  const actor = await requirePermission("users:manage");
  const { id } = await context.params;
  const changes = await parseJsonBody(request, updateRoleSchema);

  return respond(await authService.updateRole({ actor, roleId: id, changes }));
});

export const DELETE = withApiHandler(async (_request: Request, context: RouteContext) => {
  const actor = await requirePermission("users:manage");
  const { id } = await context.params;
  return respond(await authService.deleteRole({ actor, roleId: id }));
});
