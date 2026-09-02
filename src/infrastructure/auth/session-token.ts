import { SignJWT, jwtVerify } from "jose";

import { USER_ROLES, type SessionUser, type UserRole } from "@/modules/auth/domain/user";

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

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

export const createSessionToken = (user: SessionUser): Promise<string> =>
  new SignJWT({ email: user.email, fullName: user.fullName, role: user.role })
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

    if (!payload.sub || !isUserRole(payload.role)) return null;

    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      fullName: String(payload.fullName ?? ""),
      role: payload.role,
    };
  } catch {
    return null;
  }
};
