/**
 * listen — collection helpers (SERVER ONLY)
 */

import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

/** Parses a route param into an ObjectId, or returns null for a malformed id. */
export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function getDocumentsCollection() {
  const db = await getDb();
  return db.collection("documents");
}

let usersIndexed = false;
export async function getUsersCollection() {
  const db = await getDb();
  const collection = db.collection("users");
  if (!usersIndexed) {
    usersIndexed = true;
    await collection.createIndex({ email: 1 }, { unique: true });
  }
  return collection;
}

let sessionsIndexed = false;
export async function getSessionsCollection() {
  const db = await getDb();
  const collection = db.collection("sessions");
  if (!sessionsIndexed) {
    sessionsIndexed = true;
    // TTL index: MongoDB automatically deletes expired sessions.
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }
  return collection;
}
