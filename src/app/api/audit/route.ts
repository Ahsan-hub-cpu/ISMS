import { z } from "zod";

import { auditService } from "@/modules/audit";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { paginationSchema } from "@/shared/core/pagination";
import { parseSearchParams, respond, withApiHandler } from "@/shared/api/http";

const auditQuerySchema = paginationSchema.extend({
  entityType: z.string().trim().max(48).optional(),
  actorId: z.string().optional(),
});

export const GET = withApiHandler(async (request: Request) => {
  await requirePermission("audit:read");
  const query = parseSearchParams(request, auditQuerySchema);

  return respond(await auditService.list(query));
});
