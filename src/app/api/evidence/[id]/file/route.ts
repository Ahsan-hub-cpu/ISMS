import { requirePermission } from "@/modules/auth/presentation/guards";
import { evidenceService } from "@/modules/evidence";
import { NotFoundError } from "@/shared/core/errors";
import { withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Evidence files are stored outside the public folder, so this route is the
 * only way to reach them and it always checks the caller first.
 */
export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  await requirePermission("evidence:read");
  const { id } = await context.params;

  const file = await evidenceService.readFile(id);
  if (!file) throw new NotFoundError("Evidence file", id);

  return new Response(new Uint8Array(file.body), {
    headers: {
      "content-type": file.mimeType,
      "content-disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      "cache-control": "private, no-store",
    },
  });
});
