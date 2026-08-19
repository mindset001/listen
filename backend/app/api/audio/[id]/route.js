/**
 * listen — GET /api/audio/:id
 *
 * Streams a generated MP3 out of GridFS. Replaces the old /public/audio
 * static file serving, which doesn't work on a read-only serverless
 * filesystem.
 */

import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function GET(request, { params }) {
  const { id } = await params;

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const db = await getDb();
  const file = await db.collection("audio.files").findOne({ _id: objectId });
  if (!file) return new Response("Not found", { status: 404 });

  const bucket = new GridFSBucket(db, { bucketName: "audio" });
  const nodeStream = bucket.openDownloadStream(objectId);
  const webStream = Readable.toWeb(nodeStream);

  return new Response(webStream, {
    headers: {
      "Content-Type": file.contentType || "audio/mpeg",
      "Content-Length": String(file.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
