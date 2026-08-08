/**
 * listen — GridFS audio storage (SERVER ONLY)
 *
 * Generated MP3s are stored in MongoDB via GridFS (bucket "audio") and
 * served back through GET /api/audio/:id. This works on serverless hosts
 * like Vercel, where the app's own filesystem is read-only — a plain disk
 * write (the previous approach) fails there.
 */

import { GridFSBucket, ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";
import { getDb } from "./mongodb";

async function getBucket() {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: "audio" });
}

/**
 * @param {Buffer} buffer
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export async function saveAudioFile(buffer) {
  const bucket = await getBucket();
  const filename = `${randomUUID()}.mp3`;

  const fileId = await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, { contentType: "audio/mpeg" });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id.toString()));
    uploadStream.end(buffer);
  });

  return { url: `/api/audio/${fileId}`, fileId };
}

export async function deleteAudioFile(fileId) {
  if (!fileId) return;
  try {
    const bucket = await getBucket();
    await bucket.delete(new ObjectId(fileId));
  } catch {
    // Already gone or an invalid id — nothing more to do.
  }
}
