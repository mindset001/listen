"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { PlayerBar } from "@/components/PlayerBar";
import { FocusOverlay } from "@/components/FocusOverlay";
import { AudioEngine } from "@/components/AudioEngine";
import styles from "@/components/AppShell.module.css";

export default function AppLayout({ children }) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const authLoaded = useAppStore((s) => s.authLoaded);
  const fetchMe = useAppStore((s) => s.fetchMe);
  const fetchDocuments = useAppStore((s) => s.fetchDocuments);
  const fetchVoices = useAppStore((s) => s.fetchVoices);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("listen:trackingMode");
      if (stored === "list" || stored === "line") {
        useAppStore.setState({ trackingMode: stored });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (authLoaded && !user) router.replace("/login");
  }, [authLoaded, user, router]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
      fetchVoices();
    }
  }, [user, fetchDocuments, fetchVoices]);

  if (!user) return null;

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
