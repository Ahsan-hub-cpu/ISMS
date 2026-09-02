import { assessmentService } from "@/modules/assessment";
import {
  assessmentQuerySchema,
  createAssessmentSchema,
} from "@/modules/assessment/application/schemas";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";
import { parseJsonBody, parseSearchParams, respond, withApiHandler } from "@/shared/api/http";

export const GET = withApiHandler(async (request: Request) => {
  await requirePermission("assessments:read");
  const organizationId = await organizationService.currentId();
  const query = parseSearchParams(request, assessmentQuerySchema);

  return respond(await assessmentService.list(organizationId, query));
});

export const POST = withApiHandler(async (request: Request) => {
  const actor = await requirePermission("assessments:conduct");
  const organizationId = await organizationService.currentId();
  const input = await parseJsonBody(request, createAssessmentSchema);

  return respond(await assessmentService.create({ actor, organizationId, input }), 201);
});
