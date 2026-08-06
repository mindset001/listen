/**
 * listen — POST /api/documents/:id/audio
 *
 * Generates speech for a document: splits it into provider-sized chunks,
 * calls the TTS provider once per chunk, saves each MP3 to local disk, and
 * records one `audio` row per segment. The provider returns audio only (no
 * timestamps), so segment duration is the same word-count estimate the
 * reader's sentence highlighting uses — see lib/timing.js.
 */

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { generateSpeech, resolveVoice, TTSError, CHAR_LIMIT, TTS_FRIENDLY_ERRORS } from "@/lib/tts";
import { chunkDocument, splitSentences, createTiming } from "@/lib/timing";
import { saveAudioFile, deleteAudioFile } from "@/lib/audioStorage";
import { toDocumentDetail } from "@/lib/documents";

export async function POST(request, { params }) {
  const { id } = await params;
  const doc = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  if (!doc) {
    return NextResponse.json({ error: "not_found", message: "Document not found." }, { status: 404 });
  }

  const { voice, speed = 1, tone } = await request.json().catch(() => ({}));

  let voiceName;
  try {
    voiceName = resolveVoice(voice);
  } catch (err) {
    return NextResponse.json(
      { error: "voice", message: TTS_FRIENDLY_ERRORS.voice },
      { status: 400 }
    );
  }

  const chunks = chunkDocument(doc.content, CHAR_LIMIT);
  if (!chunks.length) {
    return NextResponse.json({ error: "empty", message: TTS_FRIENDLY_ERRORS.empty }, { status: 400 });
  }

  // Regenerating: drop the previous segments and their files first.
  const previous = db.prepare(`SELECT file_path FROM audio WHERE document_id = ?`).all(id);
  previous.forEach((a) => deleteAudioFile(a.file_path));
  db.prepare(`DELETE FROM audio WHERE document_id = ?`).run(id);

  const insertAudio = db.prepare(
    `INSERT INTO audio (id, document_id, segment_index, voice, speed, url, file_path, duration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  try {
    for (let i = 0; i < chunks.length; i++) {
      const { buffer } = await generateSpeech(chunks[i], voiceName, { rate: speed });
      const { url, filePath } = saveAudioFile(buffer);
      const duration = createTiming(splitSentences(chunks[i])).total;

      insertAudio.run(randomUUID(), id, i, voiceName, speed, url, filePath, duration);
    }
  } catch (err) {
    console.error("[/api/documents/:id/audio]", err);
    const code = err instanceof TTSError ? err.code : "upstream";
    return NextResponse.json(
      { error: code, message: TTS_FRIENDLY_ERRORS[code] || TTS_FRIENDLY_ERRORS.upstream },
      { status: code === "empty" ? 400 : code === "too_long" ? 413 : 502 }
    );
  }

  db.prepare(`UPDATE documents SET voice = ?, speed = ?, tone = ?, updated_at = datetime('now') WHERE id = ?`).run(
    voiceName,
    speed,
    tone || null,
    id
  );

  const updated = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  return NextResponse.json(toDocumentDetail(updated));
}
