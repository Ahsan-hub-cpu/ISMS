import { requirePermission } from "@/modules/auth/presentation/guards";
import { gapService } from "@/modules/gap";
import { updateGapSchema } from "@/modules/gap/application/schemas";
import { NotFoundError } from "@/shared/core/errors";
import { jsonOk, parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  await requirePermission("gaps:read");
  const { id } = await context.params;

  const gap = await gapService.findById(id);
  if (!gap) throw new NotFoundError("Gap", id);

  return jsonOk(gap);
});

export const PATCH = withApiHandler(async (request: Request, context: RouteContext) => {
  const actor = await requirePermission("gaps:manage");
  const { id } = await context.params;
  const changes = await parseJsonBody(request, updateGapSchema);

  return respond(await gapService.update({ actor, gapId: id, changes }));
});
