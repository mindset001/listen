"use client";

import { useRouter } from "next/navigation";
import { Play, Download } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";
import styles from "./SavedAudio.module.css";

export default function SavedAudioPage() {
  const router = useRouter();
  const toast = useToast();
  const documents = useAppStore((s) => s.documents);
  const voices = useAppStore((s) => s.voices);
  const openDocument = useAppStore((s) => s.openDocument);

  const savedAudio = documents.filter((d) => d.audio);

  async function play(doc) {
    await openDocument(doc.id);
    router.push("/reader");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {savedAudio.map((doc) => {
          const voiceName = (voices.find((v) => v.id === doc.voice) || {}).name || doc.voice;
          return (
            <div key={doc.id} className={styles.row}>
              <button
                type="button"
                onClick={() => play(doc)}
                aria-label="Play"
                className={styles.playButton}
              >
                <Play size={16} aria-hidden="true" />
              </button>
              <div className={styles.info}>
                <div className={styles.title}>{doc.title}</div>
                <div className={`${styles.meta} tabularNums`}>
                  {doc.duration} · {voiceName} · {doc.date}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast("Audio saved to your downloads", "success")}
                aria-label="Download"
                className={styles.downloadButton}
              >
                <Download size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
