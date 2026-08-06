/**
 * listen — POST /api/tts/generate
 *
 * The only path between the app and the provider. The key stays here.
 * Returns raw MP3 bytes for a single chunk of text — fine for short text;
 * documents go through POST /api/documents/:id/audio instead, which chunks,
 * generates each segment, and persists them.
 */

import { NextResponse } from "next/server";
import { generateSpeech, resolveVoice, TTSError, CHAR_LIMIT, TTS_FRIENDLY_ERRORS } from "@/lib/tts";
import { chunkDocument } from "@/lib/timing";

export async function POST(request) {
  try {
    const { text, voice, speed = 1, lang } = await request.json();

    // Reject oversized documents here; the client should chunk first.
    const chunks = chunkDocument(text, CHAR_LIMIT);
    if (chunks.length > 1) {
      return NextResponse.json(
        {
          error: "chunk_required",
          segments: chunks.length,
          message: "Send this document one segment at a time.",
        },
        { status: 413 }
      );
    }

    const { buffer, contentType } = await generateSpeech(text, resolveVoice(voice), {
      rate: speed,
      lang,
    });

    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
    });
  } catch (err) {
    // Full detail to the server log, one plain sentence to the user.
    console.error("[/api/tts/generate]", err);
    const code = err instanceof TTSError ? err.code : "upstream";
    return NextResponse.json(
      { error: code, message: TTS_FRIENDLY_ERRORS[code] || TTS_FRIENDLY_ERRORS.upstream },
      { status: code === "empty" ? 400 : code === "too_long" ? 413 : 502 }
    );
  }
}
