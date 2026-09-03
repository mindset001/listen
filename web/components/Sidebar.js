"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, Library } from "lucide-react";
import { Logo } from "./Logo";
import { useAppStore } from "@/lib/store";
import { NAV_ITEMS } from "@/lib/data";
import { AccountMenu } from "./AccountMenu";
import styles from "./AppShell.module.css";

const ICONS = {
  library: Library,
};

export function Sidebar() {
  const pathname = usePathname();
  const documents = useAppStore((s) => s.documents);

  const counts = {
    library: documents.filter((d) => !d.deleted).length,
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

      <AccountMenu />
    </aside>
  );
}
