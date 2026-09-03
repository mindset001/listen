"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AudioLines, Clock, Focus, ChevronDown, ChevronUp, List, AlignCenter } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatTime } from "@/lib/timing";
import { PLAYBACK_TOGGLES } from "@/lib/data";
import { SentenceTracker } from "@/components/SentenceTracker";
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
  const segmentStartOffsets = useAppStore((s) => s.segmentStartOffsets);
  const fontSize = useAppStore((s) => s.fontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const measure = useAppStore((s) => s.measure);
  const setFontSize = useAppStore((s) => s.setFontSize);
  const setLineHeight = useAppStore((s) => s.setLineHeight);
  const setMeasure = useAppStore((s) => s.setMeasure);
  const seekToSentence = useAppStore((s) => s.seekToSentence);
  const seekToElapsed = useAppStore((s) => s.seekToElapsed);
  const toggleFocus = useAppStore((s) => s.toggleFocus);
  const switches = useAppStore((s) => s.switches);
  const setSwitch = useAppStore((s) => s.setSwitch);
  const trackingMode = useAppStore((s) => s.trackingMode);
  const setTrackingMode = useAppStore((s) => s.setTrackingMode);

  // Text size / line spacing / width are set once and rarely touched again —
  // collapsed by default so they don't permanently eat a column; remembers
  // the user's choice locally if they do open it. This page's panel JSX
  // only ever renders once currentDocument has loaded (client-fetched, so
  // never during SSR), so reading localStorage in the initializer can't
  // cause a hydration mismatch — it just needs the typeof guard so the
  // (always-null-output) server render doesn't crash.
  const [displayOpen, setDisplayOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("listen:displayPanelOpen") === "1";
    } catch {
      return false;
    }
  });
  function toggleDisplayOpen() {
    setDisplayOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem("listen:displayPanelOpen", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  useEffect(() => {
    if (!currentDocument) router.replace("/library");
  }, [currentDocument, router]);

  const idx = timing.indexAt(elapsed);
  const segments = currentDocument?.segments || [];
  const voiceName = (voices.find((v) => v.id === voice) || {}).name || voice;

  if (!currentDocument) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.textCol} style={{ maxWidth: measure }}>
        <div className={styles.meta}>
          {voiceName}
          {segments.length > 0 && ` · Segment ${currentSegmentIndex + 1} of ${segments.length}`}
        </div>
        <h1 className={styles.title}>{currentDocument.title}</h1>
        <SentenceTracker
          sentences={timing.sentences}
          activeIndex={idx}
          mode={trackingMode}
          fontSize={fontSize}
          lineHeight={lineHeight}
          measure={measure}
          onSeek={seekToSentence}
          autoScroll={trackingMode === "list" && playing}
        />
      </div>

      <div className={styles.panel}>
        <div className={styles.panelCard}>
          <button
            type="button"
            onClick={toggleDisplayOpen}
            className={styles.panelLabelToggle}
            aria-expanded={displayOpen}
          >
            <span className={styles.panelLabel} style={{ marginBottom: 0 }}>
              Display
            </span>
            {displayOpen ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </button>
          {displayOpen && (
            <div className={styles.sliderRow} style={{ marginTop: 16 }}>
              <div>
                <div className={styles.sliderHeadLabel} style={{ marginBottom: 8 }}>
                  Line tracking
                </div>
                <div className={styles.modeToggle}>
                  <button
                    type="button"
                    onClick={() => setTrackingMode("list")}
                    className={`${styles.modeButton} ${trackingMode === "list" ? styles.modeButtonActive : ""}`}
                  >
                    <List size={13} aria-hidden="true" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingMode("line")}
                    className={`${styles.modeButton} ${trackingMode === "line" ? styles.modeButtonActive : ""}`}
                  >
                    <AlignCenter size={13} aria-hidden="true" />
                    Current line
                  </button>
                </div>
              </div>
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
          )}
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
                    onClick={() => seekToElapsed(segmentStartOffsets[i] || 0, true)}
                    className={styles.segmentRow}
                    style={{
                      background: state === "current" ? "var(--accent-wash)" : undefined,
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

        <div className={styles.panelCard}>
          <div className={styles.panelLabel}>Playback</div>
          <div className={styles.toggleList}>
            {PLAYBACK_TOGGLES.map((t) => {
              const on = switches[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSwitch(t.key)}
                  className={styles.toggleRow}
                >
                  <div className={styles.toggleInfo}>
                    <div className={styles.toggleLabel}>{t.label}</div>
                    <div className={styles.toggleNote}>{t.note}</div>
                  </div>
                  <div
                    className={styles.track}
                    style={{
                      background: on ? "var(--accent)" : "var(--line-strong)",
                      justifyContent: on ? "flex-end" : "flex-start",
                    }}
                  >
                    <div className={styles.knob} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={toggleFocus} className={styles.focusButton}>
          <Focus size={15} aria-hidden="true" />
          Enter focus mode
        </button>
      </div>
    </div>
  );
}
