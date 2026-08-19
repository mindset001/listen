/**
 * listen — GET /api/auth/google/callback
 *
 * Exchanges the authorization code for tokens, fetches the Google profile,
 * finds or creates the matching local user (linked by email), starts a
 * session, and redirects into the app. All redirect targets use
 * FRONTEND_URL, not this request's own origin — this backend has no /login
 * or /dashboard pages of its own (see the GET handler in ../route.js for
 * why).
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE, createSession, findOrCreateGoogleUser } from "@/lib/auth";

function failure(frontendUrl, reason) {
  const url = new URL("/login", frontendUrl);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request) {
  const frontendUrl = process.env.FRONTEND_URL;
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!frontendUrl) {
    return NextResponse.json(
      { error: "config", message: "Google sign-in is not configured." },
      { status: 500 }
    );
  }

  if (!code || !state || state !== expectedState) {
    return failure(frontendUrl, "oauth_state");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return failure(frontendUrl, "oauth_config");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${frontendUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return failure(frontendUrl, "oauth_token");
    const { access_token } = await tokenRes.json();

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) return failure(frontendUrl, "oauth_profile");
    const profile = await profileRes.json();

    if (!profile.email || !profile.email_verified) return failure(frontendUrl, "oauth_email");

    const user = await findOrCreateGoogleUser({
      googleId: profile.sub,
      email: profile.email.toLowerCase(),
      name: profile.name,
    });

    await createSession(user._id.toString());
    return NextResponse.redirect(new URL("/dashboard", frontendUrl));
  } catch (err) {
    console.error("[/api/auth/google/callback]", err);
    return failure(frontendUrl, "oauth_failed");
  }
}
