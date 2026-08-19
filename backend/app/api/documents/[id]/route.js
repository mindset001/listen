import { NextResponse } from "next/server";
import { getDocumentsCollection, toObjectId } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { deleteAudioFile } from "@/lib/audioStorage";
import { toDocumentDetail } from "@/lib/documents";
import { wordCount } from "@/lib/timing";

const DB_UNAVAILABLE = {
  error: "unavailable",
  message: "Could not reach the database. Try again in a moment.",
};

function notFound() {
  return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
}

export async function GET(request, { params }) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  try {
    const doc = await withRetry(async () => {
      const collection = await getDocumentsCollection();
      return collection.findOne({ _id, userId: user._id.toString() });
    });
    if (!doc) return notFound();
    return NextResponse.json(toDocumentDetail(doc));
  } catch (err) {
    console.error("[GET /api/documents/:id]", err);
    return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
  }
}

export async function PATCH(request, { params }) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  const body = await request.json();

  try {
    const updated = await withRetry(async () => {
      const collection = await getDocumentsCollection();
      const existing = await collection.findOne({ _id, userId: user._id.toString() });
      if (!existing) return null;

      const next = {
        title: body.title ?? existing.title,
        content: body.content ?? existing.content,
        tag: body.tag ?? existing.tag,
        fav: body.fav === undefined ? existing.fav : !!body.fav,
      };

      await collection.updateOne(
        { _id },
        {
          $set: {
            ...next,
            wordCount: wordCount(next.content),
            charCount: next.content.length,
            updatedAt: new Date(),
          },
        }
      );

      return collection.findOne({ _id });
    });

    if (!updated) return notFound();
    return NextResponse.json(toDocumentDetail(updated));
  } catch (err) {
    console.error("[PATCH /api/documents/:id]", err);
    return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
  }
}

export async function DELETE(request, { params }) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  try {
    const existing = await withRetry(async () => {
      const collection = await getDocumentsCollection();
      const doc = await collection.findOne({ _id, userId: user._id.toString() });
      if (!doc) return null;
      await collection.deleteOne({ _id });
      return doc;
    });

    if (!existing) return notFound();
    await Promise.all((existing.segments || []).map((s) => deleteAudioFile(s.fileId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/documents/:id]", err);
    return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
  }
}
