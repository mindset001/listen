import { NextResponse } from "next/server";
import { getDocumentsCollection } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { wordCount } from "@/lib/timing";
import { toDocumentSummary } from "@/lib/documents";

export async function GET() {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const collection = await getDocumentsCollection();
  const docs = await collection.find({ userId: user._id.toString() }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(docs.map(toDocumentSummary));
}

export async function POST(request) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { title, content, tag } = await request.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "empty", message: "Add some text first." }, { status: 400 });
  }

  const collection = await getDocumentsCollection();
  const now = new Date();
  const doc = {
    userId: user._id.toString(),
    title: title?.trim() || "Untitled",
    content,
    wordCount: wordCount(content),
    charCount: content.length,
    tag: tag || "Document",
    fav: false,
    position: 0,
    percentage: 0,
    sentenceIndex: 0,
    voice: null,
    speed: null,
    tone: null,
    segments: [],
    createdAt: now,
    updatedAt: now,
  };

  const { insertedId } = await collection.insertOne(doc);
  return NextResponse.json(toDocumentSummary({ ...doc, _id: insertedId }), { status: 201 });
}
