/**
 * listen — MongoDB connection (SERVER ONLY)
 *
 * Documents and audio metadata live in a `documents` collection (audio
 * segments embedded as an array — see lib/documents.js). Generated MP3s are
 * stored in GridFS under the `audio` bucket — see lib/audioStorage.js.
 *
 * The client is cached on `globalThis` so repeated route-handler
 * invocations in the same server process (or the same warm serverless
 * instance) reuse one connection instead of opening a new one per request.
 *
 * Connecting is deferred to first use (inside getDb()) rather than at
 * module load — `next build` imports every route module to statically
 * analyze it, and a top-level throw for a missing env var breaks the build
 * even when the var will genuinely be set at runtime.
 */

import { MongoClient } from "mongodb";

const globalForMongo = globalThis;

function createClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example) — a free cluster works at https://www.mongodb.com/cloud/atlas."
    );
  }
  return new MongoClient(uri).connect();
}

export async function getDb() {
  const clientPromise = globalForMongo.__listenMongoClientPromise || createClient();
  globalForMongo.__listenMongoClientPromise = clientPromise;

  let client;
  try {
    client = await clientPromise;
  } catch (err) {
    // Don't leave a rejected promise cached — a transient failure (a DNS
    // blip, a cold cluster) would otherwise fail every request forever
    // until the process restarts. Let the next call retry fresh.
    if (globalForMongo.__listenMongoClientPromise === clientPromise) {
      globalForMongo.__listenMongoClientPromise = undefined;
    }
    throw err;
  }

  return client.db(process.env.MONGODB_DB || "listen");
}

const TRANSIENT_ERROR_NAMES = new Set([
  "MongoNetworkError",
  "MongoServerSelectionError",
  "MongoNetworkTimeoutError",
  "MongoTopologyClosedError",
]);

function isTransient(err) {
  return (
    TRANSIENT_ERROR_NAMES.has(err?.name) ||
    TRANSIENT_ERROR_NAMES.has(err?.cause?.name) ||
    (typeof err?.hasErrorLabel === "function" &&
      (err.hasErrorLabel("RetryableError") || err.hasErrorLabel("ResetPool")))
  );
}

/**
 * Retries a DB operation once on a transient connection error (a dropped
 * socket, a server-selection timeout) before giving up. The driver retries
 * some operations internally already, but not all of them surface that —
 * this is what turns a one-off network blip into a graceful retry instead
 * of a raw 500 for the request that hit it.
 */
export async function withRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    if (!isTransient(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, 250));
    return fn();
  }
}
