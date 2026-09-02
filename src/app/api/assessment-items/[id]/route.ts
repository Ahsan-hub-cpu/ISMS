import { assessmentService } from "@/modules/assessment";
import { recordFindingSchema } from "@/modules/assessment/application/schemas";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";
import { parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Recording a finding is the trigger for the whole automatic chain: the gap is
 * identified, its risk is calculated and a remediation action is scheduled.
 */
export const PATCH = withApiHandler(async (request: Request, context: RouteContext) => {
  const actor = await requirePermission("assessments:conduct");
  const organizationId = await organizationService.currentId();
  const { id } = await context.params;
  const input = await parseJsonBody(request, recordFindingSchema);

  return respond(await assessmentService.recordFinding({ actor, organizationId, itemId: id, input }));
});
