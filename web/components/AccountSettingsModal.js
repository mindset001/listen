"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";
import shared from "@/components/shared.module.css";
import styles from "./AccountSettingsModal.module.css";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Profile / password / delete-account — moved from the old standalone
 * /settings screen into a dialog opened from the sidebar's account menu. */
export function AccountSettingsModal({ onClose }) {
  const router = useRouter();
  const toast = useToast();

  const user = useAppStore((s) => s.user);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const changePassword = useAppStore((s) => s.changePassword);
  const deleteAccount = useAppStore((s) => s.deleteAccount);

  // ---- profile ----
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profileError, setProfileError] = useState(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const emailChanged = profileEmail.trim().toLowerCase() !== user?.email;
  const profileDirty = profileName.trim() !== user?.name || emailChanged;

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError(null);

    if (!profileName.trim()) return setProfileError("Name can't be empty.");
    if (emailChanged && !EMAIL_RE.test(profileEmail.trim())) {
      return setProfileError("That does not look like an email address.");
    }
    if (emailChanged && user?.hasPassword && !profileCurrentPassword) {
      return setProfileError("Enter your current password to change your email.");
    }

    setProfileSubmitting(true);
    try {
      await updateProfile({
        name: profileName,
        email: profileEmail,
        currentPassword: profileCurrentPassword || undefined,
      });
      setProfileCurrentPassword("");
      toast("Profile updated", "success");
    } catch (err) {
      setProfileError(err.message || "Could not save your changes.");
    } finally {
      setProfileSubmitting(false);
    }
  }

  // ---- password ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError(null);

    if (user?.hasPassword && !currentPassword) {
      return setPasswordError("Enter your current password.");
    }
    if (newPassword.length < 8) return setPasswordError("Passwords need at least 8 characters.");
    if (newPassword !== confirmPassword) return setPasswordError("Passwords do not match.");

    setPasswordSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast(user?.hasPassword ? "Password updated" : "Password set", "success");
    } catch (err) {
      setPasswordError(err.message || "Could not update your password.");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  // ---- danger zone ----
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  async function handleDelete() {
    if (user?.hasPassword && !deletePassword) {
      return toast("Enter your password to confirm.", "error");
    }
    setDeleteSubmitting(true);
    try {
      await deleteAccount({ password: deletePassword });
      toast("Account deleted", "info");
      router.push("/");
    } catch (err) {
      toast(err.message || "Could not delete your account.", "error");
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Account settings" onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHead}>
          <h2 className={styles.dialogTitle}>Account settings</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={styles.closeButton}>
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.dialogBody}>
          <div className={styles.sectionLabel}>Profile</div>
          <form className={styles.formCard} onSubmit={handleProfileSubmit}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Name</span>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                aria-label="Name"
                className={shared.input}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                aria-label="Email"
                className={shared.input}
              />
            </label>
            {emailChanged && user?.hasPassword && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Current password</span>
                <input
                  type="password"
                  value={profileCurrentPassword}
                  onChange={(e) => setProfileCurrentPassword(e.target.value)}
                  placeholder="Required to change your email"
                  aria-label="Current password"
                  className={shared.input}
                />
              </label>
            )}
            {profileError && <div className={styles.fieldError}>{profileError}</div>}
            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={!profileDirty || profileSubmitting}
                className={shared.btnPrimary}
                style={{ opacity: !profileDirty || profileSubmitting ? 0.6 : 1 }}
              >
                {profileSubmitting ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>

          <div className={styles.sectionLabel}>Password</div>
          <form className={styles.formCard} onSubmit={handlePasswordSubmit}>
            {!user?.hasPassword && (
              <div className={styles.formNote}>
                You signed in with Google and don&apos;t have a password yet. Set one to also be able
                to sign in with your email.
              </div>
            )}
            {user?.hasPassword && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Current password</span>
                <div className={styles.passwordWrap}>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    aria-label="Current password"
                    className={`${shared.input} ${styles.passwordInput}`}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    className={styles.passwordToggle}
                  >
                    {passwordVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </label>
            )}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>New password</span>
              <div className={styles.passwordWrap}>
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  aria-label="New password"
                  className={`${shared.input} ${styles.passwordInput}`}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  className={styles.passwordToggle}
                >
                  {passwordVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Confirm new password</span>
              <input
                type={passwordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-label="Confirm new password"
                className={shared.input}
              />
            </label>
            {passwordError && <div className={styles.fieldError}>{passwordError}</div>}
            <div className={styles.formActions}>
              <button type="submit" disabled={passwordSubmitting} className={shared.btnPrimary}>
                {passwordSubmitting ? "Saving…" : user?.hasPassword ? "Update password" : "Set password"}
              </button>
            </div>
          </form>

          <div className={styles.sectionLabel}>Danger zone</div>
          <div className={`${styles.dangerCard} ${deleteOpen ? styles.dangerCardOpen : ""}`}>
            <div className={styles.dangerHead}>
              <div className={styles.dangerInfo}>
                <div className={styles.dangerTitle}>Delete account</div>
                <div className={styles.dangerNote}>
                  Permanently deletes your account, documents and generated audio. This can&apos;t be
                  undone.
                </div>
              </div>
              {!deleteOpen && (
                <button type="button" onClick={() => setDeleteOpen(true)} className={shared.btnOutline}>
                  Delete account
                </button>
              )}
            </div>
            {deleteOpen && (
              <div className={styles.dangerConfirm}>
                {user?.hasPassword && (
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Enter your password to confirm</span>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      aria-label="Password"
                      className={shared.input}
                    />
                  </label>
                )}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteOpen(false);
                      setDeletePassword("");
                    }}
                    className={shared.btnOutline}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteSubmitting}
                    className={styles.dangerButton}
                  >
                    <AlertTriangle size={14} aria-hidden="true" style={{ marginRight: 7, verticalAlign: -2 }} />
                    {deleteSubmitting ? "Deleting…" : "Permanently delete my account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
