import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { requireUser, verifyPassword, toPublicUser } from "@/lib/auth";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function PATCH(request) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { name, email, currentPassword } = await request.json().catch(() => ({}));
  const update = {};

  if (typeof name === "string") {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "invalid_name", message: "Name can't be empty." }, { status: 400 });
    }
    update.name = trimmedName;
  }

  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : null;
  const changingEmail = trimmedEmail && trimmedEmail !== user.email;

  if (changingEmail) {
    if (!EMAIL_RE.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "invalid_email", message: "That does not look like an email address." },
        { status: 400 }
      );
    }
    if (user.passwordHash) {
      const valid = currentPassword && (await verifyPassword(currentPassword, user.passwordHash));
      if (!valid) {
        return NextResponse.json(
          { error: "wrong_password", message: "Enter your current password to change your email." },
          { status: 401 }
        );
      }
    }
  }

  try {
    const updated = await withRetry(async () => {
      const users = await getUsersCollection();

      if (changingEmail) {
        const existing = await users.findOne({ email: trimmedEmail });
        if (existing) throw Object.assign(new Error("email_taken"), { code: "email_taken" });
        update.email = trimmedEmail;
      }

      if (!Object.keys(update).length) return user;

      await users.updateOne({ _id: user._id }, { $set: update });
      return users.findOne({ _id: user._id });
    });

    return NextResponse.json(toPublicUser(updated));
  } catch (err) {
    if (err.code === "email_taken") {
      return NextResponse.json(
        { error: "email_taken", message: "An account with that email already exists." },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/auth/profile]", err);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach the database. Try again in a moment." },
      { status: 503 }
    );
  }
}
