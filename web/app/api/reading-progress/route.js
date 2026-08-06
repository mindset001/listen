import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request) {
  const { documentId, position = 0, percentage = 0, sentenceIndex = 0 } = await request.json();

  if (!documentId) {
    return NextResponse.json({ error: "missing_document", message: "documentId is required." }, { status: 400 });
  }

  const result = db
    .prepare(
      `UPDATE documents
       SET position = ?, percentage = ?, sentence_index = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(position, Math.round(percentage), sentenceIndex, documentId);

  if (result.changes === 0) {
    return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
