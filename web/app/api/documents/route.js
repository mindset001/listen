import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { wordCount } from "@/lib/timing";
import { toDocumentSummary } from "@/lib/documents";

export async function GET() {
  const rows = db.prepare(`SELECT * FROM documents ORDER BY created_at DESC`).all();
  return NextResponse.json(rows.map(toDocumentSummary));
}

export async function POST(request) {
  const { title, content, tag } = await request.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "empty", message: "Add some text first." }, { status: 400 });
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO documents (id, title, content, word_count, char_count, tag)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, title?.trim() || "Untitled", content, wordCount(content), content.length, tag || "Document");

  const row = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  return NextResponse.json(toDocumentSummary(row), { status: 201 });
}
