import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db";
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

  const users = await getUsersCollection();
  const existing = await users.findOne({ email: trimmedEmail });
  if (existing) {
    return NextResponse.json(
      { error: "email_taken", message: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const doc = {
    name: name?.trim() || trimmedEmail.split("@")[0],
    email: trimmedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date(),
  };

  const { insertedId } = await users.insertOne(doc);
  await createSession(insertedId.toString());

  return NextResponse.json(toPublicUser({ ...doc, _id: insertedId }), { status: 201 });
}
