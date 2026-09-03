"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useAppStore } from "@/lib/store";
import styles from "./AppShell.module.css";

const TITLES = {
  "/new": "Update text",
  "/reader": "",
  "/library": "My library",
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
    </div>
  );
}
