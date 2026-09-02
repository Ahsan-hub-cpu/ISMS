import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, readSessionToken } from "@/infrastructure/auth/session-token";

const SIGN_IN_PATH = "/login";

/**
 * Page-level protection (the Next.js "proxy" convention, previously middleware).
 * API routes are deliberately excluded: they enforce their own permission checks
 * through the auth guards, which lets them return JSON 401/403 instead of a redirect.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (pathname === SIGN_IN_PATH) {
    if (!session) return NextResponse.next();
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (session) return NextResponse.next();

  const signInUrl = new URL(SIGN_IN_PATH, request.url);
  signInUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
