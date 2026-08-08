import { NextResponse } from "next/server";
import { getDocumentsCollection, toObjectId } from "@/lib/db";

export async function PUT(request) {
  const { documentId, position = 0, percentage = 0, sentenceIndex = 0 } = await request.json();

  const _id = toObjectId(documentId);
  if (!_id) {
    return NextResponse.json({ error: "missing_document", message: "documentId is required." }, { status: 400 });
  }

  const collection = await getDocumentsCollection();
  const result = await collection.updateOne(
    { _id },
    { $set: { position, percentage: Math.round(percentage), sentenceIndex, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
