/** listen — static UI config (voices/documents now come from the backend). */

export const TONES = [
  "Professional",
  "Friendly",
  "Calm",
  "Energetic",
  "Storytelling",
  "Educational",
];

export const LIBRARY_FILTERS = ["All", "Recent", "Favourites", "In progress", "Completed", "Audio"];

export const NAV_ITEMS = [{ key: "library", href: "/library", label: "My library", icon: "library" }];

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
