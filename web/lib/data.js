/** listen — static UI config (voices/documents now come from the backend). */

export const CHART = [12, 26, 0, 18, 34, 41, 22, 8, 0, 29, 47, 38, 55, 31];

export const STATS = [
  { value: "14", label: "Documents" },
  { value: "6h 42m", label: "Listening time" },
  { value: "9", label: "Completed" },
  { value: "128", label: "Pages read" },
];

export const TONES = [
  "Professional",
  "Friendly",
  "Calm",
  "Energetic",
  "Storytelling",
  "Educational",
];

export const LIBRARY_FILTERS = ["All", "Recent", "Favourites", "In progress", "Completed"];

export const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { key: "library", href: "/library", label: "My library", icon: "library" },
  { key: "audio", href: "/audio", label: "Saved audio", icon: "disc-3" },
  { key: "upload", href: "/upload", label: "Upload", icon: "file-up" },
  { key: "settings", href: "/settings", label: "Settings", icon: "settings" },
];

export const PLAYBACK_TOGGLES = [
  {
    key: "autoContinue",
    label: "Continue to next segment",
    note: "Long documents play straight through without a click.",
  },
  {
    key: "followText",
    label: "Scroll to the active sentence",
    note: "The reader keeps the spoken line in view.",
  },
  {
    key: "resume",
    label: "Remember where you stopped",
    note: "Reopening a document picks up at the last sentence.",
  },
  {
    key: "wifiOnly",
    label: "Download over Wi-Fi only",
    note: "Generated audio waits for a Wi-Fi connection.",
  },
];
