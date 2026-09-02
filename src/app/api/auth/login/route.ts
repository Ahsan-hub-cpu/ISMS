import { startSession } from "@/infrastructure/auth/session-cookie";
import { authService } from "@/modules/auth";
import { signInSchema } from "@/modules/auth/application/schemas";
import { jsonError, jsonOk, parseJsonBody, withApiHandler } from "@/shared/api/http";

export const POST = withApiHandler(async (request: Request) => {
  const credentials = await parseJsonBody(request, signInSchema);
  const result = await authService.signIn(credentials);

  if (!result.ok) {
    return jsonError(result.error);
  }

  await startSession(result.value);
  return jsonOk(result.value);
});
