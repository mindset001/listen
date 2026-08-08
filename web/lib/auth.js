/**
 * listen — auth (SERVER ONLY)
 *
 * DB-backed sessions (not JWT): a random token is stored in a `sessions`
 * collection alongside the user id, and the same token sits in an httpOnly
 * cookie. This keeps auth on the same MongoDB connection as everything
 * else, and makes "log out everywhere" / revocation trivial (delete the
 * row) — a plain signed JWT can't be revoked without extra bookkeeping.
 */

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUsersCollection, getSessionsCollection, toObjectId } from "./db";

const SESSION_COOKIE = "listen_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const OAUTH_STATE_COOKIE = "listen_oauth_state";

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/** Finds a user by email (linking a Google login to an existing password
 * account with the same address), or creates one — Google-only accounts
 * have no passwordHash, so they can only sign in via Google. */
export async function findOrCreateGoogleUser({ googleId, email, name }) {
  const users = await getUsersCollection();
  const existing = await users.findOne({ email });
  if (existing) {
    if (!existing.googleId) {
      await users.updateOne({ _id: existing._id }, { $set: { googleId } });
    }
    return existing;
  }

  const doc = { name: name || email.split("@")[0], email, googleId, createdAt: new Date() };
  const { insertedId } = await users.insertOne(doc);
  return { ...doc, _id: insertedId };
}

/** Never send passwordHash to the client. */
export function toPublicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email };
}

export async function createSession(userId) {
  const sessions = await getSessionsCollection();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await sessions.insertOne({ _id: token, userId, createdAt: new Date(), expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const sessions = await getSessionsCollection();
    await sessions.deleteOne({ _id: token });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Returns the logged-in user's Mongo document, or null. */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessions = await getSessionsCollection();
  const session = await sessions.findOne({ _id: token });
  if (!session) return null;

  const users = await getUsersCollection();
  return users.findOne({ _id: toObjectId(session.userId) });
}

/**
 * For route handlers: `const { user, unauthorized } = await requireUser();
 * if (unauthorized) return unauthorized;` — everything after that line can
 * assume `user` is a real, logged-in Mongo user document.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      unauthorized: NextResponse.json(
        { error: "unauthorized", message: "Sign in to continue." },
        { status: 401 }
      ),
    };
  }
  return { user, unauthorized: null };
}
