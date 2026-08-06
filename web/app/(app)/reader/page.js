"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, AudioLines, Clock, Focus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatTime } from "@/lib/timing";
import styles from "./Reader.module.css";

export default function ReaderPage() {
  const router = useRouter();
  const currentDocument = useAppStore((s) => s.currentDocument);
  const elapsed = useAppStore((s) => s.elapsed);
  const playing = useAppStore((s) => s.playing);
  const voice = useAppStore((s) => s.voice);
  const voices = useAppStore((s) => s.voices);
  const timing = useAppStore((s) => s.timing);
  const currentSegmentIndex = useAppStore((s) => s.currentSegmentIndex);
  const fontSize = useAppStore((s) => s.fontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const measure = useAppStore((s) => s.measure);
  const setFontSize = useAppStore((s) => s.setFontSize);
  const setLineHeight = useAppStore((s) => s.setLineHeight);
  const setMeasure = useAppStore((s) => s.setMeasure);
  const seekToSentence = useAppStore((s) => s.seekToSentence);
  const toggleFocus = useAppStore((s) => s.toggleFocus);

  const activeRef = useRef(null);
  const lastIdxRef = useRef(-1);

  useEffect(() => {
    if (!currentDocument) router.replace("/dashboard");
  }, [currentDocument, router]);

  const idx = timing.indexAt(elapsed);
  const segments = currentDocument?.segments || [];
  const voiceName = (voices.find((v) => v.id === voice) || {}).name || voice;

  useEffect(() => {
    if (idx !== lastIdxRef.current) {
      lastIdxRef.current = idx;
      if (playing && activeRef.current) {
        activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [idx, playing]);

  if (!currentDocument) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.textCol} style={{ maxWidth: measure }}>
        <div className={styles.meta}>
          {voiceName}
          {segments.length > 0 && ` · Segment ${currentSegmentIndex + 1} of ${segments.length}`}
        </div>
        <h1 className={styles.title}>{currentDocument.title}</h1>
        <div className={styles.sentences}>
          {timing.sentences.map((text, i) => {
            const active = i === idx;
            const read = i < idx;
            return (
              <div
                key={i}
                ref={active ? activeRef : null}
                onClick={() => seekToSentence(i)}
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
      </div>

      <div className={styles.panel}>
        <div className={styles.panelCard}>
          <div className={styles.panelLabel}>Display</div>
          <div className={styles.sliderRow}>
            <div>
              <div className={styles.sliderHead}>
                <span className={styles.sliderHeadLabel}>Text size</span>
                <span className={`${styles.sliderHeadValue} tabularNums`}>{fontSize}px</span>
              </div>
              <input
                type="range"
                min={15}
                max={26}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(+e.target.value)}
                aria-label="Text size"
                className={styles.slider}
              />
            </div>
            <div>
              <div className={styles.sliderHead}>
                <span className={styles.sliderHeadLabel}>Line spacing</span>
                <span className={`${styles.sliderHeadValue} tabularNums`}>
                  {lineHeight.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={140}
                max={220}
                step={5}
                value={Math.round(lineHeight * 100)}
                onChange={(e) => setLineHeight(+e.target.value / 100)}
                aria-label="Line spacing"
                className={styles.slider}
              />
            </div>
            <div>
              <div className={styles.sliderHead}>
                <span className={styles.sliderHeadLabel}>Reading width</span>
                <span className={`${styles.sliderHeadValue} tabularNums`}>{measure}px</span>
              </div>
              <input
                type="range"
                min={520}
                max={880}
                step={20}
                value={measure}
                onChange={(e) => setMeasure(+e.target.value)}
                aria-label="Reading width"
                className={styles.slider}
              />
            </div>
          </div>
        </div>

        {segments.length > 0 && (
          <div className={styles.panelCard}>
            <div className={styles.panelLabel}>Segments</div>
            <div className={styles.segmentList}>
              {segments.map((seg, i) => {
                const state = i < currentSegmentIndex ? "done" : i === currentSegmentIndex ? "current" : "upcoming";
                const Icon = state === "done" ? Check : state === "current" ? AudioLines : Clock;
                const iconColor =
                  state === "done" ? "var(--success)" : state === "current" ? "var(--accent)" : "var(--fg-3)";
                return (
                  <div
                    key={seg.id || i}
                    className={styles.segmentRow}
                    style={{
                      background: state === "current" ? "var(--accent-wash)" : "transparent",
                      borderColor: state === "current" ? "var(--accent)" : "var(--line-quiet)",
                    }}
                  >
                    <Icon size={14} aria-hidden="true" style={{ color: iconColor, flex: "none" }} />
                    <div
                      className={styles.segmentLabel}
                      style={{ color: state === "current" ? "var(--fg-1)" : "var(--fg-2)" }}
                    >
                      Segment {i + 1}
                    </div>
                    <div className={`${styles.segmentDur} tabularNums`}>
                      {formatTime(seg.duration || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button type="button" onClick={toggleFocus} className={styles.focusButton}>
          <Focus size={15} aria-hidden="true" />
          Enter focus mode
        </button>
      </div>
    </div>
  );
}
