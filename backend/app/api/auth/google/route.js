/**
 * listen — GET /api/auth/google
 *
 * Starts the Google OAuth flow: stashes a random CSRF `state` value in a
 * short-lived cookie, then redirects to Google's consent screen. The
 * redirect_uri is built from FRONTEND_URL (the web app's own domain), not
 * this request's origin — this backend is a separate service with no pages
 * of its own, so the OAuth round trip needs to land back on the frontend
 * (which proxies /api/* through to here — see web/next.config.mjs — so the
 * browser's session cookie stays scoped to the frontend's domain
 * throughout). Register FRONTEND_URL + "/api/auth/google/callback" as the
 * authorized redirect URI in Google Cloud Console.
 */

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "@/lib/auth";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const frontendUrl = process.env.FRONTEND_URL;
  if (!clientId || !frontendUrl) {
    return NextResponse.json(
      { error: "config", message: "Google sign-in is not configured." },
      { status: 500 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes — just long enough to complete the redirect round trip
  });

  const redirectUri = `${frontendUrl}/api/auth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl);
}
