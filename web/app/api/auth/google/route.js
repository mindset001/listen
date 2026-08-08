/**
 * listen — GET /api/auth/google
 *
 * Starts the Google OAuth flow: stashes a random CSRF `state` value in a
 * short-lived cookie, then redirects to Google's consent screen. The
 * redirect_uri is derived from the current request's own origin, so it
 * works unchanged in both local dev and production — just make sure both
 * are registered as authorized redirect URIs in Google Cloud Console.
 */

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "@/lib/auth";

export async function GET(request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
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

  const redirectUri = `${new URL(request.url).origin}/api/auth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl);
}
