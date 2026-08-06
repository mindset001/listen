"use client";

import { create } from "zustand";
import { createTiming, splitSentences } from "./timing";

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const DEFAULT_SWITCHES = {
  autoContinue: true,
  followText: true,
  resume: true,
  wifiOnly: false,
};

const EMPTY_TIMING = createTiming([]);

function segmentStarts(segments) {
  const starts = [];
  let acc = 0;
  for (const seg of segments) {
    starts.push(acc);
    acc += seg.duration || 0;
  }
  return starts;
}

async function api(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.message || "Request failed"), body);
  return body;
}

export const useAppStore = create((set, get) => ({
  // ---- library ----
  documents: [],
  documentsLoaded: false,
  voices: [],

  // Text handed off from the Upload screen to New reading; consumed once.
  uploadedDraft: null,
  setUploadedDraft: (draft) => set({ uploadedDraft: draft }),

  fetchDocuments: async () => {
    const documents = await api("/api/documents");
    set({ documents, documentsLoaded: true });
  },
  fetchVoices: async () => {
    const voices = await api("/api/voices");
    set({ voices });
    if (!get().voice && voices[0]) set({ voice: voices[0].id });
  },
  toggleFavorite: async (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? { ...d, fav: !d.fav } : d)),
    }));
    await api(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify({ fav: !doc.fav }) }).catch(
      () => set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, fav: doc.fav } : d)) }))
    );
  },
  removeDocument: async (id) => {
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
    await api(`/api/documents/${id}`, { method: "DELETE" });
  },
  createDocument: async ({ title, content, tag }) =>
    api("/api/documents", { method: "POST", body: JSON.stringify({ title, content, tag }) }),
  generateAudio: async (id, { voice, speed, tone }) =>
    api(`/api/documents/${id}/audio`, { method: "POST", body: JSON.stringify({ voice, speed, tone }) }),

  // ---- currently open document / player ----
  currentDocument: null,
  sentences: [],
  timing: EMPTY_TIMING,
  segmentStartOffsets: [],
  currentSegmentIndex: 0,

  playing: false,
  elapsed: 0, // seconds, at playback-rate-1 equivalent — drives sentence highlighting
  speed: 1,
  voice: "",
  tone: "Friendly",
  focus: false,

  // bumped to ask the AudioEngine to imperatively seek; { time, segmentIndex }
  seekRequest: null,

  fontSize: 18,
  lineHeight: 1.75,
  measure: 680,
  switches: DEFAULT_SWITCHES,

  openDocument: async (id) => {
    const doc = await api(`/api/documents/${id}`);
    const sentences = splitSentences(doc.content);
    const timing = createTiming(sentences);
    const starts = segmentStarts(doc.segments);
    const resume = get().switches.resume;
    const targetElapsed = resume && doc.pct < 100 ? (doc.position || 0) : 0;
    const segIdx = Math.max(
      0,
      starts.reduce((acc, start, i) => (targetElapsed >= start ? i : acc), 0)
    );

    set({
      currentDocument: doc,
      sentences,
      timing,
      segmentStartOffsets: starts,
      currentSegmentIndex: doc.segments.length ? segIdx : 0,
      elapsed: targetElapsed,
      voice: doc.voice || get().voice,
      speed: doc.speed || get().speed || 1,
      tone: doc.tone || get().tone,
      playing: doc.segments.length > 0,
      focus: false,
      seekRequest: { time: targetElapsed, segmentIndex: segIdx, token: Date.now() },
    });
  },

  refreshCurrentDocument: async () => {
    const id = get().currentDocument?.id;
    if (!id) return;
    await get().openDocument(id);
  },

  togglePlay: () => set((s) => ({ playing: !s.playing })),
  stop: () => get().seekToElapsed(0, false),

  setElapsedFromPlayback: (elapsed) => set({ elapsed }),

  seekToElapsed: (elapsed, playing = get().playing) => {
    const { timing, segmentStartOffsets } = get();
    const clamped = Math.max(0, Math.min(timing.total, elapsed));
    let segIdx = 0;
    for (let i = 0; i < segmentStartOffsets.length; i++) {
      if (clamped >= segmentStartOffsets[i]) segIdx = i;
    }
    set({
      elapsed: clamped,
      currentSegmentIndex: segIdx,
      playing,
      seekRequest: { time: clamped, segmentIndex: segIdx, token: Date.now() },
    });
  },
  seekToSentence: (i) => {
    const { timing } = get();
    get().seekToElapsed(timing.startOf(i) + 0.01, true);
  },
  prev: () => {
    const { timing, elapsed } = get();
    const idx = timing.indexAt(elapsed);
    get().seekToElapsed(timing.startOf(Math.max(0, idx - 1)) + 0.01, get().playing);
  },
  next: () => {
    const { timing, elapsed } = get();
    const idx = timing.indexAt(elapsed);
    get().seekToElapsed(timing.startOf(Math.min(timing.sentences.length - 1, idx + 1)) + 0.01, get().playing);
  },
  advanceSegment: () => {
    const { currentSegmentIndex, currentDocument, switches, segmentStartOffsets } = get();
    const segments = currentDocument?.segments || [];
    const nextIndex = currentSegmentIndex + 1;
    if (!switches.autoContinue || nextIndex >= segments.length) {
      set({ playing: false });
      return;
    }
    set({
      currentSegmentIndex: nextIndex,
      elapsed: segmentStartOffsets[nextIndex] || 0,
      seekRequest: { time: segmentStartOffsets[nextIndex] || 0, segmentIndex: nextIndex, token: Date.now() },
    });
  },

  cycleSpeed: () => set((s) => ({ speed: SPEEDS[(SPEEDS.indexOf(s.speed) + 1) % SPEEDS.length] })),
  setSpeed: (v) => set({ speed: v }),
  setVoice: (id) => set({ voice: id }),
  setTone: (t) => set({ tone: t }),

  toggleFocus: () => set((s) => ({ focus: !s.focus })),
  setFontSize: (v) => set({ fontSize: v }),
  setLineHeight: (v) => set({ lineHeight: v }),
  setMeasure: (v) => set({ measure: v }),
  setSwitch: (key) => set((s) => ({ switches: { ...s.switches, [key]: !s.switches[key] } })),

  logout: () =>
    set({
      playing: false,
      currentDocument: null,
      sentences: [],
      timing: EMPTY_TIMING,
      elapsed: 0,
      switches: DEFAULT_SWITCHES,
    }),
}));
