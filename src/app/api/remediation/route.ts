import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";
import { remediationService } from "@/modules/remediation";
import {
  createRemediationSchema,
  remediationQuerySchema,
} from "@/modules/remediation/application/schemas";
import { parseJsonBody, parseSearchParams, respond, withApiHandler } from "@/shared/api/http";

export const GET = withApiHandler(async (request: Request) => {
  await requirePermission("remediation:read");
  const organizationId = await organizationService.currentId();
  const query = parseSearchParams(request, remediationQuerySchema);

  return respond(await remediationService.list(organizationId, query));
});

/** Most actions are raised automatically from a gap; this covers the rest. */
export const POST = withApiHandler(async (request: Request) => {
  const actor = await requirePermission("remediation:manage");
  const organizationId = await organizationService.currentId();
  const input = await parseJsonBody(request, createRemediationSchema);

  return respond(await remediationService.create({ actor, organizationId, input }), 201);
});
