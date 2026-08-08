import { NextResponse } from "next/server";
import { getDocumentsCollection, toObjectId } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteAudioFile } from "@/lib/audioStorage";
import { toDocumentDetail } from "@/lib/documents";
import { wordCount } from "@/lib/timing";

function notFound() {
  return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
}

export async function GET(request, { params }) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  const collection = await getDocumentsCollection();
  const doc = await collection.findOne({ _id, userId: user._id.toString() });
  if (!doc) return notFound();
  return NextResponse.json(toDocumentDetail(doc));
}

export async function PATCH(request, { params }) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  const collection = await getDocumentsCollection();
  const existing = await collection.findOne({ _id, userId: user._id.toString() });
  if (!existing) return notFound();

  const body = await request.json();
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

  const updated = await collection.findOne({ _id });
  return NextResponse.json(toDocumentDetail(updated));
}

export async function DELETE(request, { params }) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  const collection = await getDocumentsCollection();
  const existing = await collection.findOne({ _id, userId: user._id.toString() });
  if (!existing) return notFound();

  await Promise.all((existing.segments || []).map((s) => deleteAudioFile(s.fileId)));
  await collection.deleteOne({ _id });
  return NextResponse.json({ ok: true });
}
