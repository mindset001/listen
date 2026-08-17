import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { hashPassword, createSession, toPublicUser } from "@/lib/auth";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request) {
  const { name, email, password } = await request.json().catch(() => ({}));

  const trimmedEmail = (email || "").trim().toLowerCase();
  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "invalid_email", message: "That does not look like an email address." },
      { status: 400 }
    );
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "weak_password", message: "Passwords need at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const doc = {
      name: name?.trim() || trimmedEmail.split("@")[0],
      email: trimmedEmail,
      passwordHash,
      createdAt: new Date(),
    };

    const insertedId = await withRetry(async () => {
      const users = await getUsersCollection();
      const existing = await users.findOne({ email: trimmedEmail });
      if (existing) throw Object.assign(new Error("email_taken"), { code: "email_taken" });

      const { insertedId } = await users.insertOne(doc);
      return insertedId;
    });

    await createSession(insertedId.toString());
    return NextResponse.json(toPublicUser({ ...doc, _id: insertedId }), { status: 201 });
  } catch (err) {
    if (err.code === "email_taken") {
      return NextResponse.json(
        { error: "email_taken", message: "An account with that email already exists." },
        { status: 409 }
      );
    }
    console.error("[/api/auth/signup]", err);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach the database. Try again in a moment." },
      { status: 503 }
    );
  }
}
