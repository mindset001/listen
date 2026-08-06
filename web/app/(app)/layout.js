"use client";

import { Suspense, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { PlayerBar } from "@/components/PlayerBar";
import { FocusOverlay } from "@/components/FocusOverlay";
import { AudioEngine } from "@/components/AudioEngine";
import styles from "@/components/AppShell.module.css";

export default function AppLayout({ children }) {
  const fetchDocuments = useAppStore((s) => s.fetchDocuments);
  const fetchVoices = useAppStore((s) => s.fetchVoices);

  useEffect(() => {
    fetchDocuments();
    fetchVoices();
  }, [fetchDocuments, fetchVoices]);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Suspense fallback={null}>
          <Topbar />
        </Suspense>
        <div className={styles.content}>
          {children}
          <PlayerBar />
        </div>
      </div>
      <FocusOverlay />
      <AudioEngine />
    </div>
  );
}
