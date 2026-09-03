"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy, Save, Trash2, Layers, Check, Play, AudioLines, Loader2, PenLine, FileUp } from "lucide-react";
import { useAppStore, SPEEDS } from "@/lib/store";
import { chunkDocument } from "@/lib/timing";
import { TONES } from "@/lib/data";
import { useToast } from "@/components/ToastProvider";
import { UploadPanel } from "@/components/UploadPanel";
import shared from "@/components/shared.module.css";
import styles from "./NewReading.module.css";

export default function NewReadingPage() {
  const router = useRouter();
  const toast = useToast();

  const voice = useAppStore((s) => s.voice);
  const voices = useAppStore((s) => s.voices);
  const tone = useAppStore((s) => s.tone);
  const setVoice = useAppStore((s) => s.setVoice);
  const setTone = useAppStore((s) => s.setTone);
  const speed = useAppStore((s) => s.speed);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const createDocument = useAppStore((s) => s.createDocument);
  const generateAudio = useAppStore((s) => s.generateAudio);
  const openDocument = useAppStore((s) => s.openDocument);
  const fetchDocuments = useAppStore((s) => s.fetchDocuments);

  const [mode, setMode] = useState("paste"); // "paste" | "upload"
  const [docTitle, setDocTitle] = useState("");
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genPct, setGenPct] = useState(0);
  const progressTimer = useRef(null);

  function handleExtracted({ title, text: extracted }) {
    setDocTitle(title || "");
    setText(extracted || "");
    setMode("paste");
  }

  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Same chunker (and default limit) the backend actually runs at generation
  // time — see backend/lib/tts.js CHAR_LIMIT — so this notice can't diverge
  // from what generation actually produces.
  const chunkCount = text.trim() ? chunkDocument(text).length : 0;
  const willChunk = chunkCount > 1;

  function startFakeProgress() {
    clearInterval(progressTimer.current);
    setGenPct(0);
    progressTimer.current = setInterval(() => {
      setGenPct((p) => (p >= 90 ? p : p + Math.random() * 12));
    }, 250);
  }

  async function generate() {
    if (generating) return;
    if (!text.trim()) return toast("Add some text before generating audio", "error");
    if (chars > 20000) return toast("That is over the 20,000 character limit for one document", "error");

    setGenerating(true);
    startFakeProgress();

    try {
      const doc = await createDocument({ title: docTitle, content: text, tag: "Document" });
      await generateAudio(doc.id, { voice, speed, tone });
      clearInterval(progressTimer.current);
      setGenPct(100);
      await openDocument(doc.id);
      await fetchDocuments();
      toast("Audio ready", "success");
      router.push("/reader");
    } catch (err) {
      clearInterval(progressTimer.current);
      setGenerating(false);
      setGenPct(0);
      toast(err.message || "Could not generate audio. Try again.", "error");
    }
  }

  async function saveDraft() {
    try {
      await createDocument({ title: docTitle, content: text, tag: "Draft" });
      await fetchDocuments();
      toast("Saved to your library", "success");
    } catch (err) {
      toast(err.message || "Could not save that document", "error");
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.editorCol}>
        <div className={styles.modeToggle} role="tablist" aria-label="Text source">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "paste"}
            onClick={() => setMode("paste")}
            className={`${styles.modeButton} ${mode === "paste" ? styles.modeButtonActive : ""}`}
          >
            <PenLine size={14} aria-hidden="true" />
            Paste text
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "upload"}
            onClick={() => setMode("upload")}
            className={`${styles.modeButton} ${mode === "upload" ? styles.modeButtonActive : ""}`}
          >
            <FileUp size={14} aria-hidden="true" />
            Upload file
          </button>
        </div>

        {mode === "upload" ? (
          <UploadPanel onExtracted={handleExtracted} />
        ) : (
          <>
            <input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Enter document title"
              className={styles.titleInput}
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type the text you want read aloud."
              className={styles.textarea}
            />
            <div className={styles.counterRow}>
              <div className={`${styles.counter} tabularNums`}>
                {chars.toLocaleString()} characters · {words.toLocaleString()} words
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(text).catch(() => {});
                  toast("Text copied", "success");
                }}
                className={shared.btnGhost}
              >
                <Copy size={14} aria-hidden="true" />
                Copy
              </button>
              <button type="button" onClick={saveDraft} className={shared.btnGhost}>
                <Save size={14} aria-hidden="true" />
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setText("");
                  toast("Editor cleared", "info");
                }}
                className={shared.btnGhost}
              >
                <Trash2 size={14} aria-hidden="true" />
                Clear
              </button>
            </div>

            {willChunk && (
              <div className={styles.chunkNotice}>
                <Layers size={16} aria-hidden="true" style={{ color: "var(--fg-2)", flex: "none", marginTop: 2 }} />
                <div className={styles.chunkNoticeText}>
                  This text is longer than one request allows. It will be split into{" "}
                  <strong>{chunkCount} segments</strong> at paragraph breaks and played back as one
                  continuous session.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.sideCol}>
        <div>
          <div className={styles.sideLabel}>Voice</div>
          <div className={styles.voiceList}>
            {voices.map((v) => {
              const selected = voice === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoice(v.id)}
                  className={styles.voiceRow}
                  style={{ borderColor: selected ? "var(--accent)" : "var(--line-quiet)" }}
                >
                  <div className={styles.voiceAvatar}>{v.name[0]}</div>
                  <div className={styles.voiceInfo}>
                    <div className={styles.voiceName}>{v.name}</div>
                    <div className={styles.voiceNote}>{v.note}</div>
                  </div>
                  {selected ? (
                    <Check size={15} aria-hidden="true" style={{ color: "var(--accent)" }} />
                  ) : (
                    <Play size={15} aria-hidden="true" style={{ color: "var(--fg-3)" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className={styles.speedHead}>
            <span className={styles.sideLabel} style={{ marginBottom: 0 }}>
              Speed
            </span>
            <span className={`${styles.speedValue} tabularNums`}>{speed}x</span>
          </div>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={SPEEDS.indexOf(speed)}
            onChange={(e) => setSpeed(SPEEDS[+e.target.value])}
            aria-label="Speech speed"
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
          <div className={`${styles.speedTicks} tabularNums`}>
            <span>0.5x</span>
            <span>1x</span>
            <span>2x</span>
          </div>
        </div>

        <div>
          <div className={styles.sideLabel}>Tone</div>
          <div className={styles.toneWrap}>
            {TONES.map((t) => {
              const selected = tone === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`${shared.pill} ${selected ? shared.pillSelected : ""}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className={styles.generateBtn}
          style={{
            background: generating ? "var(--line-strong)" : "var(--accent)",
            opacity: generating ? 0.7 : 1,
            cursor: generating ? "default" : "pointer",
          }}
        >
          {generating ? (
            <Loader2 size={18} aria-hidden="true" className={shared.spin} />
          ) : (
            <AudioLines size={18} aria-hidden="true" />
          )}
          {generating ? "Generating your audio" : "Generate speech"}
        </button>

        {generating && (
          <div className={styles.genProgressWrap}>
            <div className={shared.progressTrack}>
              <div className={shared.progressFill} style={{ width: Math.round(genPct) + "%" }} />
            </div>
            <div className={`${styles.genStatus} tabularNums`}>{Math.round(genPct)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
