import { NextResponse } from "next/server";
import { getDocumentsCollection } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { wordCount } from "@/lib/timing";
import { toDocumentSummary } from "@/lib/documents";

const DB_UNAVAILABLE = {
  error: "unavailable",
  message: "Could not reach the database. Try again in a moment.",
};

export async function GET() {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const docs = await withRetry(async () => {
      const collection = await getDocumentsCollection();
      return collection.find({ userId: user._id.toString() }).sort({ createdAt: -1 }).toArray();
    });
    return NextResponse.json(docs.map(toDocumentSummary));
  } catch (err) {
    console.error("[GET /api/documents]", err);
    return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
  }
}

export async function POST(request) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { title, content, tag } = await request.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "empty", message: "Add some text first." }, { status: 400 });
  }

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

  try {
    const insertedId = await withRetry(async () => {
      const collection = await getDocumentsCollection();
      const { insertedId } = await collection.insertOne(doc);
      return insertedId;
    });
    return NextResponse.json(toDocumentSummary({ ...doc, _id: insertedId }), { status: 201 });
  } catch (err) {
    console.error("[POST /api/documents]", err);
    return NextResponse.json(DB_UNAVAILABLE, { status: 503 });
  }
}
