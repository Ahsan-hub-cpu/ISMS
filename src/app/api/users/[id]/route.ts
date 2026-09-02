import { authService } from "@/modules/auth";
import { updateUserSchema } from "@/modules/auth/application/schemas";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withApiHandler(async (request: Request, context: RouteContext) => {
  const actor = await requirePermission("users:manage");
  const { id } = await context.params;
  const changes = await parseJsonBody(request, updateUserSchema);

  return respond(
    await authService.updateUser({ actorId: actor.id, targetUserId: id, changes }),
  );
});
