"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Info, CheckCircle2, AlertTriangle } from "lucide-react";
import styles from "./ToastProvider.module.css";

const ToastContext = createContext(null);

const KIND = {
  info: { Icon: Info, border: "var(--line-strong)", color: "var(--fg-2)" },
  success: { Icon: CheckCircle2, border: "var(--success)", color: "var(--success)" },
  error: { Icon: AlertTriangle, border: "var(--caution)", color: "var(--caution)" },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, kind = "info") => {
    clearTimeout(timerRef.current);
    setToast({ message, kind });
    timerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const { Icon, border, color } = KIND[toast?.kind || "info"];

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className={styles.wrap} role="status" aria-live="polite">
          <div className={styles.toast} style={{ borderColor: border }}>
            <Icon size={16} aria-hidden="true" style={{ color, flex: "none" }} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
