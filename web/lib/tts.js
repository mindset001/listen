/**
 * listen — TTS provider service (SERVER ONLY)
 *
 * Provider: TTSReader (https://ttsreader.com)
 *
 * This module is the ONLY place that knows the provider. Swapping providers
 * means rewriting this file and nothing else. It must never be imported into
 * app or browser code — it reads the API key.
 *
 * .env (server):
 *   TTS_API_KEY=UAPI-...        // get your own key — see .env.example
 *   TTS_API_URL=https://ttsreader.com/api
 *   TTS_DEFAULT_LANG=en-US
 *   TTS_QUALITY=48khz_192kbps
 *
 * Verified provider contract:
 *   POST {TTS_API_URL}/ttsSync
 *   Authorization: Bearer {TTS_API_KEY}
 *   Content-Type: application/json
 *   { text, lang, voice, rate, quality }
 *   -> binary audio/mpeg body (an MP3, not JSON)
 */

const API_URL = process.env.TTS_API_URL || "https://ttsreader.com/api";
const API_KEY = process.env.TTS_API_KEY;
const DEFAULT_LANG = process.env.TTS_DEFAULT_LANG || "en-US";
const DEFAULT_QUALITY = process.env.TTS_QUALITY || "48khz_192kbps";

/** Provider character ceiling per request. Confirm against your plan. */
export const CHAR_LIMIT = 4000;

/** Speeds the UI offers; provider takes `rate` as a multiplier. */
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export class TTSError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code; // machine-readable, for the client
    this.status = status; // upstream HTTP status, for server logs
  }
}

/**
 * Generate speech for one chunk of text.
 * @returns {Promise<{ buffer: Buffer, contentType: string, voice: string, rate: number }>}
 */
export async function generateSpeech(text, voice, options = {}) {
  if (!API_KEY) throw new TTSError("config", "TTS_API_KEY is not set");
  if (!text || !text.trim()) throw new TTSError("empty", "No text supplied");
  if (text.length > CHAR_LIMIT) {
    throw new TTSError("too_long", `Text exceeds the ${CHAR_LIMIT} character limit for one request`);
  }

  const body = {
    text,
    lang: options.lang || DEFAULT_LANG,
    voice: voice || "Nova Premium",
    rate: options.rate ?? 1,
    quality: options.quality || DEFAULT_QUALITY,
  };

  let res;
  try {
    res = await fetch(`${API_URL}/ttsSync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    // Log `cause` server-side; the client gets the plain message only.
    console.error("[tts] network error", cause);
    throw new TTSError("network", "Could not reach the speech service");
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[tts] provider error", res.status, detail.slice(0, 500));
    if (res.status === 401 || res.status === 403)
      throw new TTSError("auth", "Speech service rejected the credentials", res.status);
    if (res.status === 404) throw new TTSError("voice", "That voice is not available", res.status);
    if (res.status === 413)
      throw new TTSError("too_long", "That text is too long for one request", res.status);
    if (res.status === 429)
      throw new TTSError("rate_limit", "Too many requests — try again shortly", res.status);
    throw new TTSError("upstream", "The speech service is unavailable", res.status);
  }

  const contentType = res.headers.get("content-type") || "audio/mpeg";
  if (contentType.includes("application/json")) {
    const payload = await res.json().catch(() => ({}));
    console.error("[tts] expected audio, got json", payload);
    throw new TTSError("upstream", "The speech service returned an unexpected response");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new TTSError("upstream", "The speech service returned empty audio");

  return { buffer, contentType, voice: body.voice, rate: body.rate };
}

/**
 * Voices the app offers.
 *
 * TTSReader takes a voice NAME (e.g. "Nova Premium") rather than an id, and the
 * documented catalogue does not expose a list endpoint. Keep the catalogue here
 * — one file, server-side — and serve it from GET /api/voices so the app never
 * hard-codes voices. If the provider later ships a list endpoint, fetch it here
 * and the app needs no change.
 *
 * Confirm the exact names available on your plan before shipping.
 */
const VOICE_CATALOGUE = [
  { id: "nova", name: "Nova Premium", note: "Warm, neutral", lang: "en-US" },
  { id: "onyx", name: "Onyx Premium", note: "Low, unhurried", lang: "en-US" },
  { id: "shimmer", name: "Shimmer Premium", note: "Bright, quick", lang: "en-US" },
  { id: "echo", name: "Echo Premium", note: "Even, formal", lang: "en-US" },
];

export async function getVoices() {
  return VOICE_CATALOGUE.map((v) => ({ ...v, tones: [] }));
}

/** Resolve a UI voice id to the provider's voice name. */
export function resolveVoice(id) {
  const match = VOICE_CATALOGUE.find((v) => v.id === id || v.name === id);
  if (!match) throw new TTSError("voice", "Unknown voice");
  return match.name;
}

/**
 * Generate a whole document as ordered segments.
 * Pair with chunkDocument() from lib/timing.js — never send a full document.
 *
 * @param {string[]} chunks
 * @returns {Promise<Array<{ index: number, buffer: Buffer, contentType: string }>>}
 */
export async function generateDocument(chunks, voice, options = {}) {
  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    const { buffer, contentType } = await generateSpeech(chunks[i], voice, options);
    out.push({ index: i, buffer, contentType });
    options.onProgress?.((i + 1) / chunks.length);
  }
  return out;
}

/** Friendly, user-safe messages for TTSError codes — never surface provider detail. */
export const TTS_FRIENDLY_ERRORS = {
  empty: "Add some text before generating audio.",
  too_long: `That is over the ${CHAR_LIMIT} character limit for one request.`,
  auth: "We could not reach the speech service. Try again shortly.",
  voice: "That voice is not available. Pick another.",
  rate_limit: "Too many requests just now. Try again in a moment.",
  network: "Check your connection and try again.",
  upstream: "The speech service is unavailable. Try again shortly.",
  config: "The speech service is not configured. Add TTS_API_KEY to .env.local.",
};
