/**
 * listen — design tokens (Cairn design system)
 *
 * Dark-first. ONE accent: indigo. If indigo appears more than twice on a
 * screen, audit the design. No gradients, no decorative shadows, no blur.
 * Depth comes from the background ladder: base -> elevated -> raised.
 */

export const color = {
  bgBase: "#0B0F19",
  bgElevated: "#111727",
  bgRaised: "#1A2235",

  fg1: "#E8EAF0",
  fg2: "#9BA3B4",
  fg3: "#5C6478",

  accent: "#6366F1",
  accentHover: "#7C7FF2",
  accentWash: "rgba(99,102,241,0.10)",

  success: "#10B981",
  caution: "#F59E0B",
  danger: "#EF4444",

  lineQuiet: "#1F2638",
  lineStrong: "#2D3650",
};

export const font = {
  display: "InterTight-SemiBold",
  body: "Inter-Regular",
  bodyMedium: "Inter-Medium",
  bodySemi: "Inter-SemiBold",
  mono: "JetBrainsMono-Regular",
};

/** Mobile scale. Desktop web raises display to 64 / h1 48 / h2 36. */
export const type = {
  display: { fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  h1: { fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  h2: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  h3: { fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  bodyLg: { fontSize: 19, lineHeight: 30 },
  body: { fontSize: 16, lineHeight: 26 },
  bodySm: { fontSize: 14, lineHeight: 21 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.96, textTransform: "uppercase" },
};

/** Only these values. No intermediates. */
export const space = { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64, section: 96 };

export const radius = { button: 6, input: 8, card: 12, surface: 16, pill: 999 };

export const motion = {
  hover: 150,
  tap: 200,
  dialog: 300,
  screen: 400,
  showcase: 600,
  easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",   // entrances
  easeUI: "cubic-bezier(0.4, 0, 0.2, 1)",      // feedback
};

/** Minimum touch target. Never smaller. */
export const HIT_SLOP_MIN = 44;

/** Apply to every number that ticks or compares. */
export const tabular = { fontVariant: ["tabular-nums"] };

export const card = {
  backgroundColor: color.bgElevated,
  borderWidth: 1,
  borderColor: color.lineQuiet,
  borderRadius: radius.card,
  padding: space.lg,
};

/** Active-sentence treatment in the reader. */
export const sentenceState = {
  read: { color: color.fg3, backgroundColor: "transparent", barColor: "transparent" },
  active: { color: color.fg1, backgroundColor: color.accentWash, barColor: color.accent },
  upcoming: { color: color.fg2, backgroundColor: "transparent", barColor: "transparent" },
};
