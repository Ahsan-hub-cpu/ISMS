import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";
import { createSiteSchema } from "@/modules/organization/application/schemas";
import { parseJsonBody, respond, withApiHandler } from "@/shared/api/http";
import { success } from "@/shared/core/result";

export const GET = withApiHandler(async () => {
  await requirePermission("register:read");
  const organizationId = await organizationService.currentId();
  const sites = await organizationService.listSites(organizationId);
  return respond(success(sites));
});

export const POST = withApiHandler(async (request: Request) => {
  const actor = await requirePermission("organization:manage");
  const organizationId = await organizationService.currentId();
  const input = await parseJsonBody(request, createSiteSchema);

  return respond(await organizationService.createSite({ actor, organizationId, input }), 201);
});
