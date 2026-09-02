import "server-only";

import { cookies } from "next/headers";

import type { SessionUser } from "@/modules/auth/domain/user";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  readSessionToken,
} from "./session-token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const startSession = async (user: SessionUser): Promise<void> => {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, await createSessionToken(user), {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

export const endSession = async (): Promise<void> => {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
};

/** Current signed-in identity, or null for anonymous requests. */
export const getSession = async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE_NAME)?.value);
};
