"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, FileUp } from "lucide-react";
import { useAppStore } from "@/lib/store";
import styles from "./AppShell.module.css";
import shared from "./shared.module.css";

const TITLES = {
  "/dashboard": "Dashboard",
  "/new": "New reading",
  "/reader": "",
  "/library": "My library",
  "/audio": "Saved audio",
  "/settings": "Settings",
  "/upload": "Upload document",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDocument = useAppStore((s) => s.currentDocument);
  const [draft, setDraft] = useState("");

  const onLibrary = pathname === "/library";
  const title = pathname === "/reader" ? currentDocument?.title || "" : TITLES[pathname] || "";
  const query = onLibrary ? searchParams.get("q") || "" : draft;

  function handleSearch(e) {
    const v = e.target.value;
    if (onLibrary) {
      const params = new URLSearchParams(searchParams);
      if (v.trim()) params.set("q", v);
      else params.delete("q");
      router.replace(`/library?${params.toString()}`);
    } else {
      setDraft(v);
      if (v.trim()) router.push(`/library?q=${encodeURIComponent(v)}`);
    }
  }

  return (
    <div className={styles.topbar}>
      <div className={styles.topbarTitle}>{title}</div>
      <div className={styles.spacer} />
      <div className={styles.searchWrap}>
        <Search size={15} aria-hidden="true" className={styles.searchIcon} />
        <input
          value={query}
          onChange={handleSearch}
          placeholder="Search documents"
          aria-label="Search documents"
          className={styles.searchInput}
        />
      </div>
      <Link href="/upload" className={shared.btnOutline}>
        <FileUp size={15} aria-hidden="true" />
        Upload
      </Link>
    </div>
  );
}
