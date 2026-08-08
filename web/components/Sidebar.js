"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, LayoutDashboard, Library, Disc3, FileUp, Settings } from "lucide-react";
import { Logo } from "./Logo";
import { useAppStore } from "@/lib/store";
import { NAV_ITEMS } from "@/lib/data";
import styles from "./AppShell.module.css";

const ICONS = {
  "layout-dashboard": LayoutDashboard,
  library: Library,
  "disc-3": Disc3,
  "file-up": FileUp,
  settings: Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const documents = useAppStore((s) => s.documents);
  const user = useAppStore((s) => s.user);

  const counts = {
    library: documents.filter((d) => !d.deleted).length,
    audio: documents.filter((d) => d.audio && !d.deleted).length,
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogoRow}>
        <Logo />
      </div>

      <Link href="/new" className={styles.newButton}>
        <PenLine size={16} aria-hidden="true" />
        New reading
      </Link>

      <nav className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname.startsWith(item.href);
          const count = counts[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
            >
              <Icon size={16} aria-hidden="true" />
              <span className={styles.navLabel}>{item.label}</span>
              {typeof count === "number" && (
                <span className={`${styles.navCount} tabularNums`}>{count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.avatar}>{(user?.name || "?")[0].toUpperCase()}</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name}</div>
          <div className={styles.userPlan}>Free plan</div>
        </div>
        <Link href="/settings" aria-label="Settings" className={styles.transportBtn}>
          <Settings size={15} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
