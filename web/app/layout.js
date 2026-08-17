import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const THEME_INIT_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();`;

// Self-hosted (not next/font/google): this sandbox's network hit repeated,
// genuine failures reaching fonts.gstatic.com/googleapis.com at build and
// dev-server-compile time, which next/font/google depends on live. Each
// file below is a variable font — one file covers the whole weight range
// used, no separate download per weight. See app/fonts/README.md.
const interBody = localFont({
  src: "./fonts/Inter.woff2",
  variable: "--font-body",
  weight: "400 600",
});

const interTight = localFont({
  src: "./fonts/InterTight.woff2",
  variable: "--font-display",
  weight: "500 700",
});

const jetBrainsMono = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  variable: "--font-mono",
  weight: "400 600",
});

export const metadata = {
  title: "listen — the reading you keep meaning to do, read aloud.",
  description:
    "Paste an article, upload a paper, or drop in a chapter. listen turns it into natural speech, follows along sentence by sentence, and remembers exactly where you stopped.",
};

export const viewport = {
  colorScheme: "dark light",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${interBody.variable} ${interTight.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
