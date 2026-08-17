import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { requireUser, verifyPassword, hashPassword, createSession, revokeAllSessions, toPublicUser } from "@/lib/auth";

export async function POST(request) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { currentPassword, newPassword } = await request.json().catch(() => ({}));

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "weak_password", message: "Passwords need at least 8 characters." },
      { status: 400 }
    );
  }

  // Google-only accounts have no existing password to check — this is a
  // "set a password" flow for them rather than a change.
  if (user.passwordHash) {
    const valid = currentPassword && (await verifyPassword(currentPassword, user.passwordHash));
    if (!valid) {
      return NextResponse.json(
        { error: "wrong_password", message: "Your current password is not right." },
        { status: 401 }
      );
    }
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    const updated = await withRetry(async () => {
      const users = await getUsersCollection();
      await users.updateOne({ _id: user._id }, { $set: { passwordHash } });
      return users.findOne({ _id: user._id });
    });

    // Changing/setting a password signs out every other session — only
    // this device stays in.
    const userId = user._id.toString();
    await revokeAllSessions(userId);
    await createSession(userId);

    return NextResponse.json(toPublicUser(updated));
  } catch (err) {
    console.error("[POST /api/auth/password]", err);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach the database. Try again in a moment." },
      { status: 503 }
    );
  }
}
