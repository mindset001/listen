/**
 * listen — document read model (SERVER ONLY)
 *
 * Shapes SQLite rows into the JSON the frontend expects (same shape as the
 * former client-only mock data in lib/data.js).
 */

import { db } from "./db";
import { formatTime } from "./timing";

const PREVIEW_LENGTH = 160;

function totalDuration(documentId) {
  const row = db
    .prepare(`SELECT COALESCE(SUM(duration), 0) AS total FROM audio WHERE document_id = ?`)
    .get(documentId);
  return row.total || 0;
}

function hasAudio(documentId) {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM audio WHERE document_id = ?`)
    .get(documentId);
  return row.n > 0;
}

function relativeDate(iso) {
  const then = new Date(iso.replace(" ", "T") + "Z");
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return then.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

/** Summary shape used by Dashboard / Library / Saved audio lists. */
export function toDocumentSummary(row) {
  return {
    id: row.id,
    title: row.title,
    preview: row.content.slice(0, PREVIEW_LENGTH),
    pct: row.percentage,
    duration: formatTime(totalDuration(row.id)),
    date: relativeDate(row.created_at),
    audio: hasAudio(row.id),
    voice: row.voice,
    tag: row.tag,
    fav: !!row.fav,
    deleted: false,
  };
}

/** Full shape used by the Reader / document detail views. */
export function toDocumentDetail(row) {
  const audio = db
    .prepare(
      `SELECT id, segment_index AS segmentIndex, voice, speed, url, duration
       FROM audio WHERE document_id = ? ORDER BY segment_index ASC`
    )
    .all(row.id);

  return {
    ...toDocumentSummary(row),
    content: row.content,
    wordCount: row.word_count,
    charCount: row.char_count,
    voice: row.voice,
    speed: row.speed,
    tone: row.tone,
    position: row.position,
    sentenceIndex: row.sentence_index,
    segments: audio,
  };
}
