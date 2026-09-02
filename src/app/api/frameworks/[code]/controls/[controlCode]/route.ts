import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ code: string; controlCode: string }>;
}

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  await requirePermission("frameworks:read");
  const { code, controlCode } = await context.params;

  return respond(await frameworkService.getControl(code, decodeURIComponent(controlCode)));
});
