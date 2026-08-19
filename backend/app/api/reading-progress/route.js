import { NextResponse } from "next/server";
import { getDocumentsCollection, toObjectId } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";

export async function PUT(request) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { documentId, position = 0, percentage = 0, sentenceIndex = 0 } = await request.json();

  const _id = toObjectId(documentId);
  if (!_id) {
    return NextResponse.json({ error: "missing_document", message: "documentId is required." }, { status: 400 });
  }

  try {
    const matched = await withRetry(async () => {
      const collection = await getDocumentsCollection();
      const result = await collection.updateOne(
        { _id, userId: user._id.toString() },
        { $set: { position, percentage: Math.round(percentage), sentenceIndex, updatedAt: new Date() } }
      );
      return result.matchedCount > 0;
    });

    if (!matched) {
      return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/reading-progress]", err);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach the database. Try again in a moment." },
      { status: 503 }
    );
  }
}
