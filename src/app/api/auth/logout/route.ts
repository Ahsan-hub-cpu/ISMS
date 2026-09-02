import { endSession } from "@/infrastructure/auth/session-cookie";
import { jsonOk, withApiHandler } from "@/shared/api/http";

export const POST = withApiHandler(async () => {
  await endSession();
  return jsonOk({ signedOut: true });
});
