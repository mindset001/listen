"use client";

import { useEffect, useRef } from "react";
import styles from "./SentenceTracker.module.css";

/**
 * Renders the sentence-by-sentence reading view shared by the Reader screen
 * and Focus mode. "list" is the original full scrolling list; "line" shows
 * just the active sentence (large, centered) with the sentence before/after
 * for context — the "only seeing the current line being read" mode.
 */
export function SentenceTracker({
  sentences,
  activeIndex,
  mode,
  fontSize,
  lineHeight,
  measure,
  onSeek,
  autoScroll,
}) {
  const activeRef = useRef(null);
  const lastIdxRef = useRef(-1);

  useEffect(() => {
    if (mode !== "list") return;
    if (activeIndex !== lastIdxRef.current) {
      lastIdxRef.current = activeIndex;
      if (autoScroll && activeRef.current) {
        activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeIndex, autoScroll, mode]);

  if (mode === "line") {
    const prev = activeIndex > 0 ? sentences[activeIndex - 1] : null;
    const next = activeIndex < sentences.length - 1 ? sentences[activeIndex + 1] : null;
    return (
      <div className={styles.lineView} style={{ maxWidth: measure, width: "100%" }}>
        {prev != null && (
          <div
            onClick={() => onSeek(activeIndex - 1)}
            className={styles.lineContext}
            style={{ fontSize: Math.round(fontSize * 0.85), lineHeight }}
          >
            {prev}
          </div>
        )}
        <div
          onClick={() => onSeek(activeIndex)}
          className={styles.lineActive}
          style={{ fontSize: Math.round(fontSize * 1.4), lineHeight }}
        >
          {sentences[activeIndex] || ""}
        </div>
        {next != null && (
          <div
            onClick={() => onSeek(activeIndex + 1)}
            className={styles.lineContext}
            style={{ fontSize: Math.round(fontSize * 0.85), lineHeight }}
          >
            {next}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.sentences} style={{ maxWidth: measure, width: "100%" }}>
      {sentences.map((text, i) => {
        const active = i === activeIndex;
        const read = i < activeIndex;
        return (
          <div
            key={i}
            ref={active ? activeRef : null}
            onClick={() => onSeek(i)}
            className={styles.sentence}
            style={{
              fontSize,
              lineHeight,
              color: active ? "var(--fg-1)" : read ? "var(--fg-3)" : "var(--fg-2)",
              background: active ? "var(--accent-wash)" : "transparent",
            }}
          >
            <span
              className={styles.sentenceBar}
              style={{ background: active ? "var(--accent)" : "transparent" }}
            />
            {text}
          </div>
        );
      })}
    </div>
  );
}
