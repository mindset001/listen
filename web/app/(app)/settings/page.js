"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { PLAYBACK_TOGGLES } from "@/lib/data";
import { useToast } from "@/components/ToastProvider";
import styles from "./Settings.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();

  const fontSize = useAppStore((s) => s.fontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const measure = useAppStore((s) => s.measure);
  const setFontSize = useAppStore((s) => s.setFontSize);
  const setLineHeight = useAppStore((s) => s.setLineHeight);
  const setMeasure = useAppStore((s) => s.setMeasure);
  const switches = useAppStore((s) => s.switches);
  const setSwitch = useAppStore((s) => s.setSwitch);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    toast("Signed out", "info");
    router.push("/");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.sectionLabel}>Reading</div>
      <div className={styles.readingCard}>
        <div>
          <div className={styles.sliderHead}>
            <span className={styles.sliderHeadLabel}>Text size</span>
            <span className={`${styles.sliderHeadValue} tabularNums`}>{fontSize}px</span>
          </div>
          <input
            type="range"
            min={14}
            max={26}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(+e.target.value)}
            aria-label="Text size"
            className={styles.slider}
          />
        </div>
        <div>
          <div className={styles.sliderHead}>
            <span className={styles.sliderHeadLabel}>Line spacing</span>
            <span className={`${styles.sliderHeadValue} tabularNums`}>{lineHeight.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={140}
            max={220}
            step={5}
            value={Math.round(lineHeight * 100)}
            onChange={(e) => setLineHeight(+e.target.value / 100)}
            aria-label="Line spacing"
            className={styles.slider}
          />
        </div>
        <div>
          <div className={styles.sliderHead}>
            <span className={styles.sliderHeadLabel}>Reading width</span>
            <span className={`${styles.sliderHeadValue} tabularNums`}>{measure}px</span>
          </div>
          <input
            type="range"
            min={520}
            max={880}
            step={20}
            value={measure}
            onChange={(e) => setMeasure(+e.target.value)}
            aria-label="Reading width"
            className={styles.slider}
          />
        </div>
      </div>

      <div className={styles.sectionLabel}>Playback</div>
      <div className={styles.togglesCard}>
        {PLAYBACK_TOGGLES.map((t) => {
          const on = switches[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSwitch(t.key)}
              className={styles.toggleRow}
            >
              <div className={styles.toggleInfo}>
                <div className={styles.toggleLabel}>{t.label}</div>
                <div className={styles.toggleNote}>{t.note}</div>
              </div>
              <div
                className={styles.track}
                style={{
                  background: on ? "var(--accent)" : "var(--line-strong)",
                  justifyContent: on ? "flex-end" : "flex-start",
                }}
              >
                <div className={styles.knob} />
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>Account</div>
      <div className={styles.accountCard}>
        <div className={styles.accountAvatar}>{(user?.name || "?")[0].toUpperCase()}</div>
        <div className={styles.accountInfo}>
          <div className={styles.accountName}>{user?.name}</div>
          <div className={styles.accountEmail}>{user?.email}</div>
        </div>
        <button type="button" onClick={handleLogout} className={styles.logoutButton}>
          Log out
        </button>
      </div>
    </div>
  );
}
