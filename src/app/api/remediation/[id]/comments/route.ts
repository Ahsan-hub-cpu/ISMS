import { requirePermission } from "@/modules/auth/presentation/guards";
import { remediationService } from "@/modules/remediation";
import { addCommentSchema } from "@/modules/remediation/application/schemas";
import { parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withApiHandler(async (request: Request, context: RouteContext) => {
  const actor = await requirePermission("remediation:update");
  const { id } = await context.params;
  const { body } = await parseJsonBody(request, addCommentSchema);

  return respond(await remediationService.comment({ actor, actionId: id, body }), 201);
});
