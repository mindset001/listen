"use client";

import { X, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { SentenceTracker } from "@/components/SentenceTracker";
import styles from "./AppShell.module.css";

export function FocusOverlay() {
  const focus = useAppStore((s) => s.focus);
  const elapsed = useAppStore((s) => s.elapsed);
  const playing = useAppStore((s) => s.playing);
  const timing = useAppStore((s) => s.timing);
  const fontSize = useAppStore((s) => s.fontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const measure = useAppStore((s) => s.measure);
  const trackingMode = useAppStore((s) => s.trackingMode);
  const toggleFocus = useAppStore((s) => s.toggleFocus);
  const seekToSentence = useAppStore((s) => s.seekToSentence);
  const togglePlay = useAppStore((s) => s.togglePlay);
  const prev = useAppStore((s) => s.prev);
  const next = useAppStore((s) => s.next);

  if (!focus) return null;

  const idx = timing.indexAt(elapsed);

  return (
    <div className={styles.focusOverlay}>
      <button type="button" onClick={toggleFocus} aria-label="Exit focus mode" className={styles.focusExit}>
        <X size={17} aria-hidden="true" />
      </button>

      <SentenceTracker
        sentences={timing.sentences}
        activeIndex={idx}
        mode={trackingMode}
        fontSize={fontSize}
        lineHeight={lineHeight}
        measure={measure}
        onSeek={seekToSentence}
        autoScroll={false}
      />

      <div className={styles.focusControls}>
        <button type="button" onClick={prev} aria-label="Previous sentence" className={styles.transportBtn}>
          <SkipBack size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className={styles.playBtn}
        >
          {playing ? <Pause size={19} aria-hidden="true" /> : <Play size={19} aria-hidden="true" />}
        </button>
        <button type="button" onClick={next} aria-label="Next sentence" className={styles.transportBtn}>
          <SkipForward size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
