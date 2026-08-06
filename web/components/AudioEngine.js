"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

const PROGRESS_SAVE_INTERVAL_MS = 5000;

function saveProgress(documentId, elapsed, timing) {
  if (!documentId) return;
  const pct = timing.total ? Math.round((elapsed / timing.total) * 100) : 0;
  fetch("/api/reading-progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId,
      position: elapsed,
      percentage: pct,
      sentenceIndex: timing.indexAt(elapsed),
    }),
  }).catch(() => {});
}

/**
 * Owns the one real <audio> element for the whole app. Translates the
 * Zustand store's logical playback state (playing, elapsed, segment index,
 * seek requests) into imperative HTMLMediaElement calls, and reports real
 * playback time back into the store. No timestamps come from the TTS
 * provider, so `elapsed` is the audio's real currentTime mapped onto the
 * word-count duration estimate from lib/timing.js — see README "No
 * timestamps" note.
 */
export function AudioEngine() {
  const audioRef = useRef(null);
  const lastSavedRef = useRef(0);

  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio();
  }

  const currentDocument = useAppStore((s) => s.currentDocument);
  const segments = currentDocument?.segments || [];
  const currentSegmentIndex = useAppStore((s) => s.currentSegmentIndex);
  const playing = useAppStore((s) => s.playing);
  const speed = useAppStore((s) => s.speed);
  const seekRequest = useAppStore((s) => s.seekRequest);
  const segmentStartOffsets = useAppStore((s) => s.segmentStartOffsets);
  const timing = useAppStore((s) => s.timing);
  const setElapsedFromPlayback = useAppStore((s) => s.setElapsedFromPlayback);
  const advanceSegment = useAppStore((s) => s.advanceSegment);

  const segment = segments[currentSegmentIndex];

  // Swap source when the active segment changes.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !segment) return;
    const absoluteUrl = new URL(segment.url, window.location.origin).href;
    if (el.src !== absoluteUrl) el.src = segment.url;
  }, [segment?.url]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !segment) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing, segment?.url]);

  // currentTime is already expressed in the media's own (rate-1) timeline,
  // regardless of playbackRate — no speed scaling needed here.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !seekRequest) return;
    const start = segmentStartOffsets[seekRequest.segmentIndex] || 0;
    const localTime = Math.max(0, seekRequest.time - start);
    if (Number.isFinite(localTime)) el.currentTime = localTime;
  }, [seekRequest]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    function onTimeUpdate() {
      const start = segmentStartOffsets[currentSegmentIndex] || 0;
      const estimate = Math.min(timing.total, start + el.currentTime);
      setElapsedFromPlayback(estimate);

      const now = Date.now();
      if (playing && currentDocument && now - lastSavedRef.current > PROGRESS_SAVE_INTERVAL_MS) {
        lastSavedRef.current = now;
        saveProgress(currentDocument.id, estimate, timing);
      }
    }
    function onEnded() {
      if (currentDocument) saveProgress(currentDocument.id, timing.total, timing);
      advanceSegment();
    }

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
    };
  }, [currentSegmentIndex, segmentStartOffsets, timing, playing, currentDocument, advanceSegment, setElapsedFromPlayback]);

  // Save on pause and on unmount (e.g. navigating away from the app shell).
  useEffect(() => {
    if (!playing && currentDocument) {
      saveProgress(currentDocument.id, useAppStore.getState().elapsed, timing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    return () => {
      const doc = useAppStore.getState().currentDocument;
      if (doc) saveProgress(doc.id, useAppStore.getState().elapsed, useAppStore.getState().timing);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
