import { requirePermission } from "@/modules/auth/presentation/guards";
import { evidenceService } from "@/modules/evidence";
import { reviewEvidenceSchema } from "@/modules/evidence/application/schemas";
import { NotFoundError } from "@/shared/core/errors";
import { jsonOk, parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  await requirePermission("evidence:read");
  const { id } = await context.params;

  const evidence = await evidenceService.findById(id);
  if (!evidence) throw new NotFoundError("Evidence", id);

  return jsonOk(evidence);
});

export const PATCH = withApiHandler(async (request: Request, context: RouteContext) => {
  const actor = await requirePermission("evidence:review");
  const { id } = await context.params;
  const input = await parseJsonBody(request, reviewEvidenceSchema);

  return respond(await evidenceService.review({ actor, evidenceId: id, input }));
});

export const DELETE = withApiHandler(async (_request: Request, context: RouteContext) => {
  const actor = await requirePermission("evidence:review");
  const { id } = await context.params;

  return respond(await evidenceService.remove({ actor, evidenceId: id }));
});
