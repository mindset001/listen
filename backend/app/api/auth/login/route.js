import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { verifyPassword, createSession, toPublicUser } from "@/lib/auth";

export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));
  const trimmedEmail = (email || "").trim().toLowerCase();

  try {
    const user = await withRetry(async () => {
      const users = await getUsersCollection();
      return trimmedEmail ? users.findOne({ email: trimmedEmail }) : null;
    });
    // Google-only accounts have no passwordHash — they can't log in with a password.
    const valid = user?.passwordHash && (await verifyPassword(password || "", user.passwordHash));

    if (!valid) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "That email or password is not right." },
        { status: 401 }
      );
    }

    await createSession(user._id.toString());
    return NextResponse.json(toPublicUser(user));
  } catch (err) {
    console.error("[/api/auth/login]", err);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach the database. Try again in a moment." },
      { status: 503 }
    );
  }
}
