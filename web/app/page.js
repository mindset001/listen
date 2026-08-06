"use client";

import Link from "next/link";
import {
  ArrowRight,
  Play,
  Pause,
  Highlighter,
  Layers,
  Clock,
  Headphones,
  Focus,
  Type,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AppleMark, PlayStoreMark } from "@/components/BrandIcons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/ToastProvider";
import { useAppStore } from "@/lib/store";
import styles from "./page.module.css";

const STEPS = [
  {
    n: "01",
    title: "Bring the text",
    body: "Paste it, type it, or upload a TXT, PDF or DOCX. Long files are split into segments automatically.",
  },
  {
    n: "02",
    title: "Pick a voice",
    body: "Four voices, seven speeds, six tones. Change any of them mid-document without losing your place.",
  },
  {
    n: "03",
    title: "Press play",
    body: "The reader highlights the sentence being spoken and scrolls with it. Stop anywhere and it remembers.",
  },
];

const FEATURES = [
  {
    Icon: Highlighter,
    title: "Follows the sentence",
    body: "The line being spoken stays highlighted and in view. Click any sentence to jump the audio there.",
  },
  {
    Icon: Layers,
    title: "Handles long documents",
    body: "A 40-page paper is split at paragraph breaks, generated as segments, and played as one session.",
  },
  {
    Icon: Clock,
    title: "Remembers your place",
    body: "Come back a week later and the document opens at the sentence you stopped on, not the top.",
  },
  {
    Icon: Headphones,
    title: "Real audio files",
    body: "Download what you generate as audio and keep listening in any player, offline.",
  },
  {
    Icon: Focus,
    title: "Focus mode",
    body: "Hides the sidebar, the player and everything else. Just the text and the voice.",
  },
  {
    Icon: Type,
    title: "Set for your eyes",
    body: "Text size, line spacing and reading width are yours to set, and they stick.",
  },
];

export default function LandingPage() {
  const toast = useToast();
  const router = useRouter();
  const openDocument = useAppStore((s) => s.openDocument);

  async function tryDemo() {
    try {
      const documents = await fetch("/api/documents").then((r) => r.json());
      if (!documents?.length) {
        toast("Create an account to try it with your own text.", "info");
        return;
      }
      await openDocument(documents[0].id);
      router.push("/reader");
    } catch {
      toast("Couldn't load the demo right now. Try again shortly.", "error");
    }
  }

  return (
    <>
      <nav className={styles.nav}>
        <Logo />
        <div className={styles.navLinks}>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#apps">Apps</a>
        </div>
        <div className={styles.navActions}>
          <ThemeToggle />
          <Link href="/login" className={styles.btnOutline}>
            Sign in
          </Link>
          <Link href="/signup" className={styles.btnAccentSmall}>
            Create account
          </Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <div>
          <div className={styles.kicker}>Text to speech, built for long reading</div>
          <h1 className={styles.headline}>
            The reading you keep meaning to do, read aloud.
          </h1>
          <p className={styles.subhead}>
            Paste an article, upload a paper, or drop in a chapter. listen turns it
            into natural speech, follows along sentence by sentence, and remembers
            exactly where you stopped.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.btnPrimary}>
              Start listening free
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <button type="button" className={styles.btnSecondary} onClick={tryDemo}>
              <Play size={16} aria-hidden="true" />
              Try the demo
            </button>
          </div>
          <div className={styles.footnote}>
            Free for the first 20,000 characters a month. No card.
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.heroCardLabel}>Now playing</div>
          <div className={styles.heroSentences}>
            <p className={styles.heroSentence}>
              It is not the tiredness of hard thinking. It is the tiredness of
              holding your eyes still.
            </p>
            <p className={styles.heroSentenceActive}>
              Listening moves the work somewhere else. The words arrive at a
              steady pace, and your attention rides along with them.
            </p>
            <p className={styles.heroSentenceUpcoming}>
              This is why so many people who never finished a book on paper will
              finish four in a month.
            </p>
          </div>
          <div className={styles.heroPlayer}>
            <div className={styles.heroPlayButton}>
              <Pause size={17} aria-hidden="true" />
            </div>
            <div className={styles.heroPlayerTrack}>
              <div className={styles.heroPlayerBar}>
                <div className={styles.heroPlayerBarFill} />
              </div>
              <div className={`${styles.heroPlayerTimes} tabularNums`}>
                <span>03:07</span>
                <span>08:12</span>
              </div>
            </div>
            <div className={`${styles.heroPlayerSpeed} tabularNums`}>1.25x</div>
          </div>
        </div>
      </header>

      <section id="how" className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Three steps, then you stop looking at the screen.
        </h2>
        <p className={styles.sectionBody}>
          No setup, no library to organise first. Paste something and press
          play.
        </p>
        <div className={styles.grid3}>
          {STEPS.map((s) => (
            <div key={s.n} className={styles.card}>
              <div className={`${styles.stepNumber} tabularNums`}>{s.n}</div>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.cardBody}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Built for documents that are actually long.
        </h2>
        <div className={styles.grid3}>
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className={`${styles.card} ${styles.cardHover}`}>
              <Icon size={20} aria-hidden="true" className={styles.featureIcon} />
              <h3 className={styles.cardTitleSm}>{title}</h3>
              <p className={styles.cardBody}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="apps" className={styles.section}>
        <div className={styles.appsPanel}>
          <div>
            <h2 className={styles.appsTitle}>
              Start on your desk, finish on the walk home.
            </h2>
            <p className={styles.appsBody}>
              Your place, your speed and your voice follow you across devices.
              Generated audio downloads for offline listening.
            </p>
          </div>
          <div className={styles.storeButtons}>
            <button
              type="button"
              className={styles.storeButton}
              onClick={() =>
                toast("The iOS build ships alongside the web app", "info")
              }
            >
              <AppleMark size={24} />
              <div>
                <div className={styles.storeButtonEyebrow}>Download on the</div>
                <div className={styles.storeButtonLabel}>App Store</div>
              </div>
            </button>
            <button
              type="button"
              className={styles.storeButton}
              onClick={() =>
                toast("The Android build ships alongside the web app", "info")
              }
            >
              <PlayStoreMark size={22} />
              <div>
                <div className={styles.storeButtonEyebrow}>Get it on</div>
                <div className={styles.storeButtonLabel}>Google Play</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <h2 className={styles.closingTitle}>Give your eyes the afternoon off.</h2>
        <p className={styles.closingBody}>
          Free for the first 20,000 characters a month.
        </p>
        <Link href="/signup" className={styles.btnPrimary} style={{ display: "inline-flex" }}>
          Create your account
        </Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>listen — a text-to-speech reader</div>
          <div className={styles.footerLinks}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </div>
        </div>
      </footer>
    </>
  );
}
