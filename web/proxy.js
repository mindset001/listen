/**
 * listen — route protection
 *
 * Redirects to /login when the session cookie is entirely absent. This is
 * a cheap, cookie-presence-only check — it does not hit the database, so a
 * stale/expired cookie still gets through here. The app shell's own
 * GET /api/auth/me call (see (app)/layout.js) is the real source of truth
 * and signs the user out client-side if the session turns out to be
 * invalid. Belt and suspenders: this just avoids a flash of protected
 * content for the common "never logged in" case.
 */

import { NextResponse } from "next/server";

const SESSION_COOKIE = "listen_session";

export function proxy(request) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/library/:path*",
    "/new/:path*",
    "/reader/:path*",
    "/audio/:path*",
    "/upload/:path*",
    "/settings/:path*",
  ],
};
