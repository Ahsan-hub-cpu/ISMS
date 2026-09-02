import { requirePermission } from "@/modules/auth/presentation/guards";
import { registerService } from "@/modules/register";
import { updateRegisterEntrySchema } from "@/modules/register/application/schemas";
import { parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withApiHandler(async (request: Request, context: RouteContext) => {
  const actor = await requirePermission("register:manage");
  const { id } = await context.params;
  const changes = await parseJsonBody(request, updateRegisterEntrySchema);

  return respond(await registerService.update({ actor, entryId: id, changes }));
});
