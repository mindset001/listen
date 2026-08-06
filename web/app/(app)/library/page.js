"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AudioLines, Heart, Play, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LIBRARY_FILTERS } from "@/lib/data";
import { useToast } from "@/components/ToastProvider";
import shared from "@/components/shared.module.css";
import styles from "./Library.module.css";

function LibraryContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  const documents = useAppStore((s) => s.documents);
  const openDocument = useAppStore((s) => s.openDocument);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const removeDocument = useAppStore((s) => s.removeDocument);

  const [filter, setFilter] = useState("All");

  const filtered = documents.filter((d) => {
    if (d.deleted) return false;
    if (query && !(d.title + " " + d.preview).toLowerCase().includes(query)) return false;
    if (filter === "Favourites") return d.fav;
    if (filter === "Completed") return d.pct === 100;
    if (filter === "In progress") return d.pct > 0 && d.pct < 100;
    if (filter === "Recent") return ["Today", "Yesterday"].includes(d.date);
    return true;
  });

  async function open(doc) {
    await openDocument(doc.id);
    router.push("/reader");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.filters}>
        {LIBRARY_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`${shared.pill} ${filter === f ? shared.pillSelected : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map((doc) => {
            const cta = doc.pct === 0 ? "Listen" : doc.pct === 100 ? "Listen again" : `Continue ${doc.pct}%`;
            const statusLabel =
              doc.pct === 0 ? "Not started" : doc.pct === 100 ? "Completed" : `In progress ${doc.pct}%`;
            const statusColor =
              doc.pct === 100 ? "var(--success)" : doc.pct === 0 ? "var(--fg-3)" : "var(--fg-2)";
            return (
              <div key={doc.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.tag}>{doc.tag}</span>
                  {doc.audio && (
                    <AudioLines size={13} aria-hidden="true" style={{ color: "var(--accent)" }} />
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(doc.id)}
                    aria-label="Favourite"
                    className={styles.favButton}
                    style={{ color: doc.fav ? "var(--accent)" : "var(--fg-3)" }}
                  >
                    <Heart size={15} aria-hidden="true" fill={doc.fav ? "currentColor" : "none"} />
                  </button>
                </div>
                <h3 className={styles.cardTitle}>{doc.title}</h3>
                <p className={styles.cardPreview}>{doc.preview}</p>
                <div className={`${styles.statusRow} tabularNums`}>
                  <span style={{ color: statusColor }}>{statusLabel}</span>
                  <span>·</span>
                  <span>{doc.duration}</span>
                </div>
                <div className={styles.cardActions}>
                  <button type="button" onClick={() => open(doc)} className={shared.btnOutline} style={{ flex: 1 }}>
                    <Play size={14} aria-hidden="true" />
                    {cta}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeDocument(doc.id);
                      toast("Document deleted", "info");
                    }}
                    aria-label="Delete"
                    className={styles.deleteButton}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyStone} />
          <div className={styles.emptyText}>
            {query || filter !== "All"
              ? "Nothing matches that. Your first document goes here."
              : "Nothing here yet. Your first document goes here."}
          </div>
          <button
            type="button"
            onClick={() => {
              setFilter("All");
              router.push("/library");
            }}
            className={shared.btnOutline}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryContent />
    </Suspense>
  );
}
