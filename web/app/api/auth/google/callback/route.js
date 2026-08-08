/**
 * listen — GET /api/auth/google/callback
 *
 * Exchanges the authorization code for tokens, fetches the Google profile,
 * finds or creates the matching local user (linked by email), starts a
 * session, and redirects into the app.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE, createSession, findOrCreateGoogleUser } from "@/lib/auth";

function failure(origin, reason) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request) {
  const { origin } = new URL(request.url);
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!code || !state || state !== expectedState) {
    return failure(origin, "oauth_state");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return failure(origin, "oauth_config");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return failure(origin, "oauth_token");
    const { access_token } = await tokenRes.json();

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) return failure(origin, "oauth_profile");
    const profile = await profileRes.json();

    if (!profile.email || !profile.email_verified) return failure(origin, "oauth_email");

    const user = await findOrCreateGoogleUser({
      googleId: profile.sub,
      email: profile.email.toLowerCase(),
      name: profile.name,
    });

    await createSession(user._id.toString());
    return NextResponse.redirect(new URL("/dashboard", origin));
  } catch (err) {
    console.error("[/api/auth/google/callback]", err);
    return failure(origin, "oauth_failed");
  }
}
