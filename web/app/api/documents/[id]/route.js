import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteAudioFile } from "@/lib/audioStorage";
import { toDocumentDetail } from "@/lib/documents";
import { wordCount } from "@/lib/timing";

function notFound() {
  return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
}

export async function GET(request, { params }) {
  const { id } = await params;
  const row = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  if (!row) return notFound();
  return NextResponse.json(toDocumentDetail(row));
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const existing = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  if (!existing) return notFound();

  const body = await request.json();
  const next = {
    title: body.title ?? existing.title,
    content: body.content ?? existing.content,
    tag: body.tag ?? existing.tag,
    fav: body.fav === undefined ? existing.fav : body.fav ? 1 : 0,
  };

  db.prepare(
    `UPDATE documents
     SET title = ?, content = ?, tag = ?, fav = ?, word_count = ?, char_count = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(next.title, next.content, next.tag, next.fav, wordCount(next.content), next.content.length, id);

  const row = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  return NextResponse.json(toDocumentDetail(row));
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const existing = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  if (!existing) return notFound();

  const audioRows = db.prepare(`SELECT file_path FROM audio WHERE document_id = ?`).all(id);
  audioRows.forEach((a) => deleteAudioFile(a.file_path));

  db.prepare(`DELETE FROM documents WHERE id = ?`).run(id);
  return NextResponse.json({ ok: true });
}
