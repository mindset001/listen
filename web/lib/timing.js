/**
 * listen — sentence timing model
 *
 * The prototype estimates sentence durations from word count. Everything that
 * needs to know "which sentence is playing" goes through this module, so real
 * provider timestamps can replace the estimate without touching any screen.
 *
 * Usage:
 *   const t = createTiming(sentences);                    // estimated
 *   const t = createTiming(sentences, providerTimings);   // real timestamps
 *
 *   t.total                 // seconds
 *   t.indexAt(elapsed)      // active sentence index
 *   t.startOf(i)            // start time of sentence i
 *   t.progress(elapsed)     // 0..1
 */

export const WORDS_PER_MINUTE = 165;
export const MIN_SENTENCE_SECONDS = 1.6;

/** Split a block of text into sentences, keeping terminal punctuation. */
export function splitSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z"'\u201c])/)
    .filter(Boolean);
}

export function wordCount(text) {
  const t = String(text || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * @param {string[]} sentences
 * @param {{start:number,end:number}[]} [timings] provider-supplied, in seconds
 */
export function createTiming(sentences, timings) {
  const list = sentences || [];

  const durations = timings && timings.length === list.length
    ? timings.map((t) => Math.max(0.1, t.end - t.start))
    : list.map((s) => Math.max(MIN_SENTENCE_SECONDS, (wordCount(s) / WORDS_PER_MINUTE) * 60));

  const starts = [];
  let acc = 0;
  for (let i = 0; i < durations.length; i++) { starts.push(acc); acc += durations[i]; }
  const total = acc;

  return {
    sentences: list,
    durations,
    total,
    estimated: !(timings && timings.length === list.length),
    startOf: (i) => starts[Math.max(0, Math.min(starts.length - 1, i))] || 0,
    endOf: (i) => (starts[i] || 0) + (durations[i] || 0),
    indexAt: (elapsed) => {
      for (let i = 0; i < durations.length; i++) {
        if (elapsed < starts[i] + durations[i]) return i;
      }
      return Math.max(0, durations.length - 1);
    },
    progress: (elapsed) => (total ? Math.min(1, Math.max(0, elapsed / total)) : 0),
  };
}

/** mm:ss — pair with tabular-nums wherever it renders. */
export function formatTime(seconds) {
  const t = Math.max(0, Math.round(seconds || 0));
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function nextSpeed(current) {
  return SPEEDS[(SPEEDS.indexOf(current) + 1) % SPEEDS.length];
}

/**
 * Split a document for a provider character limit: paragraphs first,
 * sentences only if a paragraph is still too long. Never send the whole thing.
 */
export function chunkDocument(text, limit = 4000) {
  const paragraphs = String(text || "").split(/\n\s*\n/).filter((p) => p.trim());
  const chunks = [];
  let buf = "";

  const flush = () => { if (buf.trim()) chunks.push(buf.trim()); buf = ""; };

  for (const p of paragraphs) {
    if (p.length > limit) {
      flush();
      let s = "";
      for (const sentence of splitSentences(p)) {
        if ((s + " " + sentence).length > limit) { if (s) chunks.push(s.trim()); s = sentence; }
        else s += (s ? " " : "") + sentence;
      }
      if (s) chunks.push(s.trim());
    } else if ((buf + "\n\n" + p).length > limit) {
      flush();
      buf = p;
    } else {
      buf += (buf ? "\n\n" : "") + p;
    }
  }
  flush();
  return chunks;
}
