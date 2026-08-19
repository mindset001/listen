"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, PenLine, FileUp, Heart } from "lucide-react";
import { useAppStore } from "@/lib/store";
import shared from "@/components/shared.module.css";
import styles from "./Dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const documents = useAppStore((s) => s.documents);
  const currentDocument = useAppStore((s) => s.currentDocument);
  const timing = useAppStore((s) => s.timing);
  const elapsed = useAppStore((s) => s.elapsed);
  const openDocument = useAppStore((s) => s.openDocument);

  const recent = documents.slice(0, 4);

  const continueDoc = currentDocument
    ? { title: currentDocument.title, pct: timing.total ? Math.round((elapsed / timing.total) * 100) : 0 }
    : documents[0]
      ? { title: documents[0].title, pct: documents[0].pct }
      : null;

  async function openDoc(id) {
    await openDocument(id);
    router.push("/reader");
  }

  function handleContinue() {
    if (currentDocument) router.push("/reader");
    else if (documents[0]) openDoc(documents[0].id);
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.welcome}>Welcome back, {user?.name}</h1>
      <p className={styles.welcomeSub}>
        Pick up where you left off, or start something new.
      </p>

      <div className={styles.quickActions}>
        {continueDoc && (
          <button type="button" onClick={handleContinue} className={styles.continueCard}>
            <div className={styles.continueIconWell}>
              <Play size={21} aria-hidden="true" />
            </div>
            <div className={styles.continueText}>
              <div className={styles.continueTitle}>Continue reading</div>
              <div className={styles.continueSub}>
                {continueDoc.title} · {continueDoc.pct}% through
              </div>
            </div>
          </button>
        )}
        <Link href="/new" className={styles.quickCard}>
          <PenLine size={21} aria-hidden="true" className={styles.quickCardIcon} />
          <div className={styles.quickCardLabel}>Paste or type text</div>
        </Link>
        <Link href="/upload" className={styles.quickCard}>
          <FileUp size={21} aria-hidden="true" className={styles.quickCardIcon} />
          <div className={styles.quickCardLabel}>Upload a document</div>
        </Link>
      </div>

      <div className={styles.colHeader}>
        <h2 className={styles.colTitle}>Recent reads</h2>
        <Link href="/library" className={styles.seeAll}>
          See all
        </Link>
      </div>
      <div className={styles.recentList}>
        {recent.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => openDoc(doc.id)}
            className={styles.recentCard}
          >
            <div className={styles.recentInfo}>
              <div className={styles.recentTop}>
                <span className={styles.recentTag}>{doc.tag}</span>
                {doc.fav && (
                  <Heart
                    size={13}
                    aria-hidden="true"
                    fill="var(--accent)"
                    style={{ color: "var(--accent)" }}
                  />
                )}
              </div>
              <div className={styles.recentTitle}>{doc.title}</div>
              <div className={styles.recentPreview}>{doc.preview}</div>
              <div className={styles.recentMetaRow}>
                <div className={shared.progressTrack} style={{ flex: 1 }}>
                  <div
                    className={shared.progressFill}
                    style={{ width: doc.pct + "%" }}
                  />
                </div>
                <div className={`${styles.recentMeta} tabularNums`}>
                  {doc.pct}% · {doc.duration}
                </div>
              </div>
            </div>
            <div className={styles.recentPlayWell}>
              <Play size={15} aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
