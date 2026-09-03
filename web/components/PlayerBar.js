"use client";

import { usePathname } from "next/navigation";
import { Play, Pause, SkipBack, SkipForward, Square, Heart, Download } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatTime } from "@/lib/timing";
import { useToast } from "./ToastProvider";
import styles from "./AppShell.module.css";

const VISIBLE_ON = ["/library", "/new", "/reader"];

export function PlayerBar() {
  const pathname = usePathname();
  const toast = useToast();

  const currentDocument = useAppStore((s) => s.currentDocument);
  const playing = useAppStore((s) => s.playing);
  const elapsed = useAppStore((s) => s.elapsed);
  const speed = useAppStore((s) => s.speed);
  const voice = useAppStore((s) => s.voice);
  const voices = useAppStore((s) => s.voices);
  const focus = useAppStore((s) => s.focus);
  const timing = useAppStore((s) => s.timing);
  const currentSegmentIndex = useAppStore((s) => s.currentSegmentIndex);
  const togglePlay = useAppStore((s) => s.togglePlay);
  const stop = useAppStore((s) => s.stop);
  const prev = useAppStore((s) => s.prev);
  const next = useAppStore((s) => s.next);
  const seekToElapsed = useAppStore((s) => s.seekToElapsed);
  const cycleSpeed = useAppStore((s) => s.cycleSpeed);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const segments = currentDocument?.segments || [];
  const hasAudio = segments.length > 0;
  const visible = VISIBLE_ON.includes(pathname) && hasAudio && !focus;
  if (!visible) return null;

  const voiceName = (voices.find((v) => v.id === voice) || {}).name || voice;

  function handleSeek(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    seekToElapsed(timing.total * ratio, playing);
  }

  return (
    <div className={styles.player}>
      <div className={styles.playerMetaBlock}>
        <div className={styles.wave}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${styles.waveBar} ${playing ? styles.waveBarPlaying : ""}`}
              style={{ animationDelay: i * 130 + "ms" }}
            />
          ))}
        </div>
        <div className={styles.playerText}>
          <div className={styles.playerTitle}>{currentDocument.title}</div>
          <div className={styles.playerSub}>
            {voiceName} · Segment {currentSegmentIndex + 1} of {segments.length}
          </div>
        </div>
      </div>

      <div className={styles.transport}>
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
        <button type="button" onClick={stop} aria-label="Stop" className={styles.transportBtn}>
          <Square size={15} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.seekRow}>
        <div className={`${styles.timeLabel} tabularNums`}>{formatTime(elapsed)}</div>
        <div className={styles.seekTrack} onClick={handleSeek}>
          <div className={styles.seekBar}>
            <div
              className={styles.seekFill}
              style={{ width: (timing.total ? (elapsed / timing.total) * 100 : 0) + "%" }}
            />
          </div>
        </div>
        <div className={`${styles.timeLabel} tabularNums`}>{formatTime(timing.total)}</div>
      </div>

      <div className={styles.playerActions}>
        <button
          type="button"
          onClick={cycleSpeed}
          aria-label="Playback speed"
          className={`${styles.speedChip} tabularNums`}
        >
          {speed}x
        </button>
        <button
          type="button"
          onClick={() => {
            toggleFavorite(currentDocument.id);
            toast("Added to favourites", "success");
          }}
          aria-label="Favourite"
          className={styles.transportBtn}
        >
          <Heart size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = segments[currentSegmentIndex]?.url;
            if (url) {
              const a = document.createElement("a");
              a.href = url;
              a.download = "";
              a.click();
            }
            toast("Audio saved to your downloads", "success");
          }}
          aria-label="Download audio"
          className={styles.transportBtn}
        >
          <Download size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
