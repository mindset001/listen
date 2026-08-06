"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import styles from "./AppShell.module.css";

export function FocusOverlay() {
  const focus = useAppStore((s) => s.focus);
  const elapsed = useAppStore((s) => s.elapsed);
  const timing = useAppStore((s) => s.timing);
  const fontSize = useAppStore((s) => s.fontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const measure = useAppStore((s) => s.measure);
  const toggleFocus = useAppStore((s) => s.toggleFocus);
  const seekToSentence = useAppStore((s) => s.seekToSentence);

  if (!focus) return null;

  const idx = timing.indexAt(elapsed);

  return (
    <div className={styles.focusOverlay}>
      <button
        type="button"
        onClick={toggleFocus}
        aria-label="Exit focus mode"
        className={styles.focusExit}
      >
        <X size={17} aria-hidden="true" />
      </button>
      <div className={styles.focusList} style={{ maxWidth: measure }}>
        {timing.sentences.map((text, i) => (
          <div
            key={i}
            onClick={() => seekToSentence(i)}
            className={styles.focusLine}
            style={{
              fontSize,
              lineHeight,
              color: i === idx ? "var(--fg-1)" : i < idx ? "var(--fg-3)" : "var(--fg-2)",
              background: i === idx ? "var(--accent-wash)" : "transparent",
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
