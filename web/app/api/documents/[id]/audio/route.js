/**
 * listen — POST /api/documents/:id/audio
 *
 * Generates speech for a document: splits it into provider-sized chunks,
 * calls the TTS provider once per chunk, saves each MP3 to GridFS, and
 * records one segment per chunk on the document. The provider returns audio
 * only (no timestamps), so segment duration is the same word-count estimate
 * the reader's sentence highlighting uses — see lib/timing.js.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDocumentsCollection, toObjectId } from "@/lib/db";
import { withRetry } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { generateSpeech, resolveVoice, TTSError, CHAR_LIMIT, TTS_FRIENDLY_ERRORS } from "@/lib/tts";
import { chunkDocument, splitSentences, createTiming } from "@/lib/timing";
import { saveAudioFile, deleteAudioFile } from "@/lib/audioStorage";
import { toDocumentDetail } from "@/lib/documents";

export async function POST(request, { params }) {
  const { user, unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) {
    return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
  }

  let doc;
  try {
    doc = await withRetry(async () => {
      const collection = await getDocumentsCollection();
      return collection.findOne({ _id, userId: user._id.toString() });
    });
  } catch (err) {
    console.error("[POST /api/documents/:id/audio]", err);
    return NextResponse.json(
      { error: "unavailable", message: "Could not reach the database. Try again in a moment." },
      { status: 503 }
    );
  }
  if (!doc) {
    return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
  }

  const { voice, speed = 1, tone } = await request.json().catch(() => ({}));

  let voiceName;
  try {
    voiceName = resolveVoice(voice);
  } catch {
    return NextResponse.json({ error: "voice", message: TTS_FRIENDLY_ERRORS.voice }, { status: 400 });
  }

  const chunks = chunkDocument(doc.content, CHAR_LIMIT);
  if (!chunks.length) {
    return NextResponse.json({ error: "empty", message: TTS_FRIENDLY_ERRORS.empty }, { status: 400 });
  }

  // Regenerating: drop the previous segments' files first.
  await Promise.all((doc.segments || []).map((s) => deleteAudioFile(s.fileId)));

  const segments = [];
  try {
    for (let i = 0; i < chunks.length; i++) {
      const { buffer } = await generateSpeech(chunks[i], voiceName, { rate: speed });
      const { url, fileId } = await saveAudioFile(buffer);
      const duration = createTiming(splitSentences(chunks[i])).total;

      segments.push({ id: randomUUID(), segmentIndex: i, voice: voiceName, speed, url, fileId, duration });
    }
  } catch (err) {
    console.error("[/api/documents/:id/audio]", err);
    // Any segments already saved this attempt are orphaned — clean them up.
    await Promise.all(segments.map((s) => deleteAudioFile(s.fileId)));
    const code = err instanceof TTSError ? err.code : "upstream";
    return NextResponse.json(
      { error: code, message: TTS_FRIENDLY_ERRORS[code] || TTS_FRIENDLY_ERRORS.upstream },
      { status: code === "empty" ? 400 : code === "too_long" ? 413 : 502 }
    );
  }

  try {
    const updated = await withRetry(async () => {
      const collection = await getDocumentsCollection();
      await collection.updateOne(
        { _id },
        { $set: { voice: voiceName, speed, tone: tone || null, segments, updatedAt: new Date() } }
      );
      return collection.findOne({ _id });
    });
    return NextResponse.json(toDocumentDetail(updated));
  } catch (err) {
    console.error("[POST /api/documents/:id/audio]", err);
    // The audio itself generated fine and is already saved — only the DB
    // write to record it failed. Not worth deleting the freshly-made files
    // over; surface it as a retryable failure instead.
    return NextResponse.json(
      { error: "unavailable", message: "Audio generated, but saving it failed. Try again." },
      { status: 503 }
    );
  }
}
