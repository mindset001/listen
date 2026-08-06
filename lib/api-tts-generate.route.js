/**
 * listen — POST /api/tts/generate   (Next.js App Router)
 *
 * The only path between the app and the provider. The key stays here.
 * Store the returned audio in object storage and hand the client a URL;
 * streaming the bytes back (as below) is fine for short single-chunk text.
 */

import { NextResponse } from "next/server";
import { generateSpeech, resolveVoice, TTSError, CHAR_LIMIT } from "@/lib/tts";
import { chunkDocument } from "@/lib/timing";

const FRIENDLY = {
  empty: "Add some text before generating audio.",
  too_long: `That is over the ${CHAR_LIMIT} character limit for one request.`,
  auth: "We could not reach the speech service. Try again shortly.",
  voice: "That voice is not available. Pick another.",
  rate_limit: "Too many requests just now. Try again in a moment.",
  network: "Check your connection and try again.",
  upstream: "The speech service is unavailable. Try again shortly.",
  config: "The speech service is not configured.",
};

export async function POST(request) {
  try {
    const { text, voice, speed = 1, lang } = await request.json();

    // Reject oversized documents here; the client should chunk first.
    const chunks = chunkDocument(text, CHAR_LIMIT);
    if (chunks.length > 1) {
      return NextResponse.json(
        { error: "chunk_required", segments: chunks.length, message: "Send this document one segment at a time." },
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
      { error: code, message: FRIENDLY[code] || FRIENDLY.upstream },
      { status: code === "empty" ? 400 : code === "too_long" ? 413 : 502 }
    );
  }
}
