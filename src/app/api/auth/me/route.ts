import { permissionsFor } from "@/modules/auth/domain/permissions";
import { requireSession } from "@/modules/auth/presentation/guards";
import { jsonOk, withApiHandler } from "@/shared/api/http";

export const GET = withApiHandler(async () => {
  const session = await requireSession();
  return jsonOk({ user: session, permissions: permissionsFor(session.role) });
});
