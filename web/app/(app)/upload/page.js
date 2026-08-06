"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, FileText, Check, PenLine } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";
import shared from "@/components/shared.module.css";
import styles from "./Upload.module.css";

export default function UploadPage() {
  const router = useRouter();
  const toast = useToast();
  const setUploadedDraft = useAppStore((s) => s.setUploadedDraft);

  const [stage, setStage] = useState(0); // 0 idle, 1 busy, 2 done
  const [pct, setPct] = useState(0);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null); // { text, wordCount, pageCount }
  const inputRef = useRef(null);

  function pickFile() {
    inputRef.current?.click();
  }

  function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    setStage(1);
    setPct(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 90));
    };
    xhr.onload = () => {
      let body = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        setPct(100);
        setResult(body);
        setTimeout(() => setStage(2), 200);
      } else {
        setStage(0);
        toast(body.message || "Could not read that file.", "error");
      }
    };
    xhr.onerror = () => {
      setStage(0);
      toast("Upload failed. Check your connection and try again.", "error");
    };
    xhr.send(formData);
  }

  function openInEditor() {
    const title = fileName.replace(/\.[^.]+$/, "");
    setUploadedDraft({ title, text: result?.text || "" });
    router.push("/new");
  }

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.pdf,.docx"
        onChange={(e) => handleFile(e.target.files?.[0])}
        style={{ display: "none" }}
      />

      {stage === 0 && (
        <button
          type="button"
          onClick={pickFile}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={styles.dropzone}
        >
          <FileUp size={28} aria-hidden="true" style={{ color: "var(--accent)" }} />
          <div className={styles.dropzoneTitle}>Drop a file here, or choose one</div>
          <div className={styles.dropzoneSub}>TXT, PDF or DOCX · up to 20 MB</div>
        </button>
      )}

      {stage === 1 && (
        <div className={styles.busyCard}>
          <div className={styles.busyTop}>
            <FileText size={18} aria-hidden="true" style={{ color: "var(--fg-2)" }} />
            <div className={styles.busyName}>{fileName}</div>
            <div className={`${styles.busyPct} tabularNums`}>{pct}%</div>
          </div>
          <div className={shared.progressTrack} style={{ height: 4 }}>
            <div className={shared.progressFill} style={{ width: pct + "%" }} />
          </div>
          <div className={styles.busyStatus}>{pct < 90 ? "Uploading file" : "Extracting text"}</div>
        </div>
      )}

      {stage === 2 && result && (
        <>
          <div className={styles.doneCard}>
            <Check size={17} aria-hidden="true" style={{ color: "var(--success)", flex: "none", marginTop: 2 }} />
            <div className={styles.doneText}>
              Extracted <strong>{result.wordCount.toLocaleString()} words</strong>
              {result.pageCount > 1 ? ` from ${result.pageCount} pages` : ""}. Review the text, then
              generate audio.
            </div>
          </div>
          <button type="button" onClick={openInEditor} className={styles.openButton}>
            <PenLine size={17} aria-hidden="true" />
            Open in editor
          </button>
        </>
      )}
    </div>
  );
}
