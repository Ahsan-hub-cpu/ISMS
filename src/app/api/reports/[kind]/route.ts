import { requirePermission } from "@/modules/auth/presentation/guards";
import { complianceService, REPORT_KINDS, type ReportKind } from "@/modules/compliance";
import { organizationService } from "@/modules/organization";
import { NotFoundError } from "@/shared/core/errors";
import { withApiHandler } from "@/shared/api/http";
import { csvResponse } from "@/shared/utils/csv";

interface RouteContext {
  params: Promise<{ kind: string }>;
}

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  await requirePermission("reports:read");
  const { kind } = await context.params;

  if (!REPORT_KINDS.includes(kind as ReportKind)) {
    throw new NotFoundError("Report", kind);
  }

  const organizationId = await organizationService.currentId();
  const csv = await complianceService.report(kind as ReportKind, organizationId);
  const today = new Date().toISOString().slice(0, 10);

  return csvResponse(`${kind}-${today}.csv`, csv);
});
