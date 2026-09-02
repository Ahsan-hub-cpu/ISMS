import { assessmentService } from "@/modules/assessment";
import { assessmentItemQuerySchema } from "@/modules/assessment/application/schemas";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { parseSearchParams, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler(async (request: Request, context: RouteContext) => {
  await requirePermission("assessments:read");
  const { id } = await context.params;
  const query = parseSearchParams(request, assessmentItemQuerySchema);

  return respond(await assessmentService.listItems(id, query));
});
