"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library, Clock, Disc3, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { Logo } from "./Logo";
import { AppleMark, GoogleMark, PlayStoreMark } from "./BrandIcons";
import { ThemeToggle } from "./ThemeToggle";
import { useToast } from "./ToastProvider";
import { useAppStore } from "@/lib/store";
import styles from "./AuthForm.module.css";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const COPY = {
  login: {
    title: "Welcome back",
    sub: "Sign in to pick up where you left off.",
    cta: "Sign in",
    switchLabel: "New here?",
    switchCta: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    sub: "Twenty thousand characters a month, free. No card needed.",
    cta: "Create account",
    switchLabel: "Already have an account?",
    switchCta: "Sign in",
    switchHref: "/login",
  },
  forgot: {
    title: "Reset your password",
    sub: "Enter your email and we will send you a reset link.",
    cta: "Send reset link",
    switchLabel: "Remembered it?",
    switchCta: "Back to sign in",
    switchHref: "/login",
  },
};

const AUTH_POINTS = [
  {
    Icon: Library,
    title: "Your library",
    body: "Everything you have pasted or uploaded, searchable and filterable.",
  },
  {
    Icon: Clock,
    title: "Reading progress",
    body: "Position and percentage per document, synced across your devices.",
  },
  {
    Icon: Disc3,
    title: "Generated audio",
    body: "Every file you have made, ready to replay or download again.",
  },
  {
    Icon: LockKeyhole,
    title: "Private by default",
    body: "Documents are never sold and never used for model training.",
  },
];

export function AuthForm({ mode }) {
  const router = useRouter();
  const toast = useToast();
  const signup = useAppStore((s) => s.signup);
  const login = useAppStore((s) => s.login);
  const copy = COPY[mode];

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPass, setFormPass] = useState("");
  const [formConfirmPass, setFormConfirmPass] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showPassword = mode !== "forgot";
  const showSocial = mode !== "forgot";

  async function handleSubmit(e) {
    e.preventDefault();
    const email = formEmail.trim();

    if (!email) return setEmailError("Enter your email address");
    if (!EMAIL_RE.test(email))
      return setEmailError("That does not look like an email address");

    if (mode === "forgot") {
      toast("Password reset isn't wired up yet — sign in directly for now.", "info");
      return;
    }

    if (mode === "signup" && formPass.length < 8) {
      toast("Passwords need at least 8 characters", "error");
      return;
    }

    if (mode === "signup" && formConfirmPass !== formPass) {
      return setConfirmError("Passwords do not match");
    }

    setEmailError(null);
    setConfirmError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup({ name: formName, email, password: formPass });
        toast("Account created — welcome", "success");
      } else {
        await login({ email, password: formPass });
        toast("Signed in", "success");
      }
      router.push("/library");
    } catch (err) {
      toast(err.message || "Something went wrong. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.grid}>
      <div className={styles.formCol}>
        <div className={styles.header}>
          <Link href="/" className={styles.back}>
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.sub}>{copy.sub}</p>

        <form className={styles.fields} onSubmit={handleSubmit} noValidate>
          {mode === "signup" && (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Name</span>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Your name"
                aria-label="Your name"
                className={styles.input}
              />
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => {
                setFormEmail(e.target.value);
                setEmailError(null);
              }}
              placeholder="you@example.com"
              aria-label="Email address"
              className={styles.input}
              style={emailError ? { borderColor: "var(--caution)" } : undefined}
            />
            {emailError && <div className={styles.fieldError}>{emailError}</div>}
          </label>

          {showPassword && (
            <label className={styles.field}>
              <span className={styles.fieldLabelRow}>
                <span className={styles.fieldLabel}>Password</span>
                {mode === "login" && (
                  <Link href="/forgot-password" className={styles.forgotLink}>
                    Forgot?
                  </Link>
                )}
              </span>
              <div className={styles.passwordWrap}>
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={formPass}
                  onChange={(e) => setFormPass(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  aria-label="Password"
                  className={`${styles.input} ${styles.passwordInput}`}
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

          {mode === "signup" && (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Confirm password</span>
              <div className={styles.passwordWrap}>
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={formConfirmPass}
                  onChange={(e) => {
                    setFormConfirmPass(e.target.value);
                    setConfirmError(null);
                  }}
                  placeholder="Type your password again"
                  aria-label="Confirm password"
                  className={`${styles.input} ${styles.passwordInput}`}
                  style={confirmError ? { borderColor: "var(--caution)" } : undefined}
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
              {confirmError && <div className={styles.fieldError}>{confirmError}</div>}
            </label>
          )}

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? "Please wait…" : copy.cta}
          </button>
        </form>

        {showSocial && (
          <>
            <div className={styles.divider}>
              <span />
              <span className={styles.dividerLabel}>or</span>
              <span />
            </div>
            <a href="/api/auth/google" className={styles.social}>
              <GoogleMark size={16} />
              Continue with Google
            </a>
            <button
              type="button"
              className={styles.social}
              onClick={() =>
                toast("Apple sign-in is stubbed in the prototype", "info")
              }
            >
              <AppleMark size={16} />
              Continue with Apple
            </button>
          </>
        )}

        <div className={styles.switchRow}>
          <span>{copy.switchLabel}</span>
          <Link href={copy.switchHref} className={styles.switchLink}>
            {copy.switchCta}
          </Link>
        </div>

        {mode === "signup" && (
          <p className={styles.terms}>
            By creating an account you agree to the terms and the privacy
            policy. listen does not sell your documents or use them for
            training.
          </p>
        )}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelLabel}>What your account holds</div>
        <div className={styles.panelPoints}>
          {AUTH_POINTS.map(({ Icon, title, body }) => (
            <div key={title} className={styles.panelPoint}>
              <Icon size={18} aria-hidden="true" className={styles.panelIcon} />
              <div>
                <div className={styles.panelPointTitle}>{title}</div>
                <div className={styles.panelPointBody}>{body}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.panelStores}>
          <button
            type="button"
            className={styles.panelStoreButton}
            onClick={() =>
              toast("The iOS build ships alongside the web app", "info")
            }
          >
            <AppleMark size={16} />
            iOS
          </button>
          <button
            type="button"
            className={styles.panelStoreButton}
            onClick={() =>
              toast("The Android build ships alongside the web app", "info")
            }
          >
            <PlayStoreMark size={15} />
            Android
          </button>
        </div>
      </div>
    </div>
  );
}
