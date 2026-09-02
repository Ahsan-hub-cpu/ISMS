import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { controlQuerySchema } from "@/modules/framework/application/schemas";
import { parseSearchParams, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export const GET = withApiHandler(async (request: Request, context: RouteContext) => {
  await requirePermission("frameworks:read");
  const { code } = await context.params;
  const query = parseSearchParams(request, controlQuerySchema);

  return respond(await frameworkService.searchControls(code, query));
});
