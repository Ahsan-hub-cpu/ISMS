import { requirePermission } from "@/modules/auth/presentation/guards";
import { gapService } from "@/modules/gap";
import { gapQuerySchema } from "@/modules/gap/application/schemas";
import { parseSearchParams, respond, withApiHandler } from "@/shared/api/http";

/**
 * Gaps are only ever read or updated through the API. They are created by the
 * assessment process itself, so there is deliberately no POST here.
 */
export const GET = withApiHandler(async (request: Request) => {
  await requirePermission("gaps:read");
  const query = parseSearchParams(request, gapQuerySchema);

  return respond(await gapService.list(query));
});
