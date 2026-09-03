"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";
import styles from "./AccountMenu.module.css";

/** Sidebar footer account entry point — replaces the old standalone
 * /settings nav item. Opens a small menu (log out, account settings) instead
 * of taking over the whole screen. */
export function AccountMenu() {
  const router = useRouter();
  const toast = useToast();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    toast("Signed out", "info");
    router.push("/");
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className={styles.avatar}>{(user?.name || "?")[0].toUpperCase()}</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name}</div>
          <div className={styles.userPlan}>Free plan</div>
        </div>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <div className={styles.menuName}>{user?.name}</div>
            <div className={styles.menuEmail}>{user?.email}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              setSettingsOpen(true);
            }}
          >
            <Settings size={15} aria-hidden="true" />
            Account settings
          </button>
          <button type="button" role="menuitem" className={styles.menuItemDanger} onClick={handleLogout}>
            <LogOut size={15} aria-hidden="true" />
            Log out
          </button>
        </div>
      )}

      {settingsOpen && <AccountSettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
