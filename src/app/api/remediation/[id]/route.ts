import { requirePermission } from "@/modules/auth/presentation/guards";
import { remediationService } from "@/modules/remediation";
import { updateRemediationSchema } from "@/modules/remediation/application/schemas";
import { ForbiddenError, NotFoundError } from "@/shared/core/errors";
import { can } from "@/modules/auth/domain/permissions";
import { jsonOk, parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Fields a control owner may change on their own action. */
const OWNER_EDITABLE = new Set(["status", "progressPercent"]);

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  await requirePermission("remediation:read");
  const { id } = await context.params;

  const action = await remediationService.findById(id);
  if (!action) throw new NotFoundError("Remediation action", id);

  return jsonOk(action);
});

export const PATCH = withApiHandler(async (request: Request, context: RouteContext) => {
  const actor = await requirePermission("remediation:update");
  const { id } = await context.params;
  const changes = await parseJsonBody(request, updateRemediationSchema);

  if (!can(actor.role, "remediation:manage")) {
    const action = await remediationService.findById(id);
    if (!action) throw new NotFoundError("Remediation action", id);

    // A control owner reports progress on their own work; reassigning it or
    // changing its scope stays with whoever manages the plan.
    if (action.ownerId !== actor.id) {
      throw new ForbiddenError("You can only update actions assigned to you.");
    }
    if (Object.keys(changes).some((field) => !OWNER_EDITABLE.has(field))) {
      throw new ForbiddenError("You may only update the status and progress of this action.");
    }
  }

  return respond(await remediationService.update({ actor, actionId: id, changes }));
});
