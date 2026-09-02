import { z } from "zod";

import { assessmentService } from "@/modules/assessment";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { parseJsonBody, respond, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({ target: z.enum(["SUBMITTED", "APPROVED"]) });

export const POST = withApiHandler(async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const { target } = await parseJsonBody(request, bodySchema);

  // Submitting is part of conducting an assessment; approving is a separate,
  // more senior responsibility.
  const actor = await requirePermission(
    target === "APPROVED" ? "assessments:approve" : "assessments:conduct",
  );

  return respond(await assessmentService.changeStatus({ actor, assessmentId: id, target }));
});
