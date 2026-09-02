import "server-only";

import { getSession } from "@/infrastructure/auth/session-cookie";
import { ForbiddenError, UnauthorizedError } from "@/shared/core/errors";

import { can, type Permission } from "../domain/permissions";
import type { SessionUser } from "../domain/user";

/**
 * Guards used by API routes and server components.
 * They throw AppErrors, which `withApiHandler` turns into the right HTTP status.
 */
export const requireSession = async (): Promise<SessionUser> => {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError("You must sign in to continue.");
  }
  return session;
};

export const requirePermission = async (permission: Permission): Promise<SessionUser> => {
  const session = await requireSession();
  if (!can(session.role, permission)) {
    throw new ForbiddenError("Your role does not allow this action.");
  }
  return session;
};

export { getSession as getOptionalSession };
