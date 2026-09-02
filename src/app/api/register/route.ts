import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";
import { registerService } from "@/modules/register";
import { registerQuerySchema } from "@/modules/register/application/schemas";
import { parseSearchParams, respond, withApiHandler } from "@/shared/api/http";

export const GET = withApiHandler(async (request: Request) => {
  await requirePermission("register:read");
  const organizationId = await organizationService.currentId();
  const query = parseSearchParams(request, registerQuerySchema);

  return respond(await registerService.list(organizationId, query));
});
