import { requireSession } from "@/modules/auth/presentation/guards";
import { markNotificationRead } from "@/modules/notifications";
import { jsonOk, withApiHandler } from "@/shared/api/http";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withApiHandler(async (_request: Request, context: RouteContext) => {
  const session = await requireSession();
  const { id } = await context.params;
  await markNotificationRead(session.id, id);
  return jsonOk({ id, read: true });
});
