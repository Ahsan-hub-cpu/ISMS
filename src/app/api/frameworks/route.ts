import { frameworkService } from "@/modules/framework";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { respond, withApiHandler } from "@/shared/api/http";

export const GET = withApiHandler(async () => {
  await requirePermission("frameworks:read");
  return respond(await frameworkService.listFrameworks());
});
