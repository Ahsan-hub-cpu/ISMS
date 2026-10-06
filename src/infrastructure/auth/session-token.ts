import { SignJWT, jwtVerify } from "jose";

import { isPermission, type Permission } from "@/modules/auth/domain/permissions";
import type { SessionUser } from "@/modules/auth/domain/user";

export const SESSION_COOKIE_NAME = "isms_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const ISSUER = "isms-platform";

// Read directly from process.env: this module also runs in middleware, where the
// server-only validated config module cannot be imported.
const secretKey = (): Uint8Array => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const createSessionToken = (user: SessionUser): Promise<string> =>
  new SignJWT({
    email: user.email,
    fullName: user.fullName,
    roleId: user.roleId,
    roleCode: user.roleCode,
    roleName: user.roleName,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());

/** Returns the session identity, or null when the token is missing, invalid or expired. */
export const readSessionToken = async (token: string | undefined): Promise<SessionUser | null> => {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });

    if (!payload.sub || typeof payload.roleId !== "string" || typeof payload.roleCode !== "string") {
      return null;
    }

    const permissions = asStringArray(payload.permissions).filter(isPermission) as Permission[];

    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      fullName: String(payload.fullName ?? ""),
      roleId: payload.roleId,
      roleCode: payload.roleCode,
      roleName: String(payload.roleName ?? payload.roleCode),
      permissions,
    };
  } catch {
    return null;
  }
};
