/**
 * listen — GET /api/audio/:id
 *
 * Streams a generated MP3 out of GridFS. Replaces the old /public/audio
 * static file serving, which doesn't work on a read-only serverless
 * filesystem.
 *
 * Requires auth + ownership (a document whose segments include this GridFS
 * id, belonging to the requesting user) — generated audio is otherwise
 * publicly fetchable by anyone with the id, which contradicts the "private
 * by default" promise made at signup.
 */

import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getDocumentsCollection } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function contentDispositionFilename(title) {
  const safe = (title || "audio").replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || "audio";
  return `attachment; filename="${safe}.mp3"; filename*=UTF-8''${encodeURIComponent(safe)}.mp3`;
}

export async function GET(request, { params }) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const documents = await getDocumentsCollection();
  const owningDoc = await documents.findOne({
    userId: user._id.toString(),
    "segments.fileId": id,
  });
  if (!owningDoc) return new Response("Not found", { status: 404 });

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
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Disposition": contentDispositionFilename(owningDoc.title),
    },
  });
}
