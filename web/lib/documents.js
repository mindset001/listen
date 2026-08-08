/**
 * listen — document read model (SERVER ONLY)
 *
 * Shapes MongoDB documents into the JSON the frontend expects. Audio
 * segments are embedded directly on the document (see lib/mongodb.js) —
 * no join needed.
 */

import { formatTime } from "./timing";

const PREVIEW_LENGTH = 160;

function relativeDate(date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

/** Summary shape used by Dashboard / Library / Saved audio lists. */
export function toDocumentSummary(doc) {
  const segments = doc.segments || [];
  const totalDuration = segments.reduce((sum, s) => sum + (s.duration || 0), 0);

  return {
    id: doc._id.toString(),
    title: doc.title,
    preview: doc.content.slice(0, PREVIEW_LENGTH),
    pct: doc.percentage || 0,
    duration: formatTime(totalDuration),
    date: relativeDate(doc.createdAt),
    audio: segments.length > 0,
    voice: doc.voice || null,
    tag: doc.tag,
    fav: !!doc.fav,
    deleted: false,
  };
}

/** Full shape used by the Reader / document detail views. */
export function toDocumentDetail(doc) {
  const segments = (doc.segments || [])
    .slice()
    .sort((a, b) => a.segmentIndex - b.segmentIndex)
    .map((s) => ({
      id: s.id,
      segmentIndex: s.segmentIndex,
      voice: s.voice,
      speed: s.speed,
      url: s.url,
      duration: s.duration,
    }));

  return {
    ...toDocumentSummary(doc),
    content: doc.content,
    wordCount: doc.wordCount,
    charCount: doc.charCount,
    voice: doc.voice || null,
    speed: doc.speed || null,
    tone: doc.tone || null,
    position: doc.position || 0,
    sentenceIndex: doc.sentenceIndex || 0,
    segments,
  };
}
