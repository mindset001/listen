# Handoff: listen — AI text-to-speech reader

## Overview

**listen** is a text-to-speech reader. A user brings text (paste, type, or upload TXT/PDF/DOCX), picks a voice, speed and tone, generates audio, and listens while the app highlights and auto-scrolls the sentence currently being spoken. It saves documents, generated audio, favourites and reading position, so a document reopens at the sentence the user stopped on.

Target output is a **React Native (Expo) app for iOS and Android**, plus a **web marketing/landing site** and a **backend that owns the TTS provider key**.

## About the design files

The files in this bundle are **design references created in HTML**. They are prototypes showing intended look and behaviour — they are **not production code to copy**. The task is to **recreate these designs in React Native** (and Next.js for the landing page) using that environment's own patterns and libraries.

Two prototypes are included:

| File | Viewport | Contains |
|---|---|---|
| `TTS Reader.dc.html` | 402×874 (iPhone frame) | Splash, dashboard, new reading, reader, library, saved audio, upload, settings, auth — **this is the spec for the mobile app** |
| `listen - Desktop.dc.html` | 1440×900 | Marketing landing page, login/signup/forgot, plus the same app screens in a desktop shell — **the landing + auth pages are the spec for the web site** |

Both are single-file HTML "Design Components": markup at the top, a `class Component` logic block near the bottom. Open either in a browser to interact with it.

## Fidelity

**High-fidelity.** Colours, typography, spacing, radii, motion timings and copy are final and should be matched exactly. Every value comes from the Cairn design system (dark-first, single indigo accent) — see **Design tokens** below.

Two deliberate exceptions, both marked in the prototype:
- **Audio playback is simulated.** A 100 ms interval advances an `elapsed` counter; sentence durations are estimated from word count. Replace with real audio (see **Audio & TTS**).
- **App Store / Google Play buttons are custom-drawn**, not the official badges. Swap in Apple's and Google's supplied artwork before shipping — their badge guidelines require it.

---

## Architecture

```
Expo app (iOS / Android)          Next.js site (marketing + auth)
        │                                    │
        └──────────────┬─────────────────────┘
                       ▼
            Your backend API  ── holds TTS_API_KEY ──▶ TTS provider
                       │
                  Postgres + object storage (audio files)
```

**The TTS key never reaches a device or a browser.** All generation goes through your backend.

Recommended stack:
- **Expo** + **expo-router** (file-per-screen, mirrors the prototype's screens)
- **react-native-track-player** for audio — needed for background playback and lock-screen controls. `expo-av` is fine only if you don't need either.
- **expo-sqlite** or WatermelonDB for local documents/progress; AsyncStorage only for settings
- **lucide-react-native** for icons (the prototype uses Lucide paths)
- **Zustand** or Redux Toolkit for player state (one global store; the player outlives screen navigation)
- **expo-document-picker** for uploads; parsing happens server-side

---

## Screens

Every screen below exists in `TTS Reader.dc.html`. Screen switching there is a single `state.screen` string — in Expo these become routes.

### 1. Splash

**Purpose:** brand moment while voices load and the last position is restored.

**Layout:** full-bleed `#0B0F19`, everything centred.

- **Waveform mark** — five bars, widths 8px, gap 7px, heights `[14, 42, 72, 42, 22]`px, radius 4px. Centre bar `#6366F1`, others `#2D3650`. Bars animate in one at a time: each starts at 8px height / 0.25 opacity and grows to full over 600 ms `cubic-bezier(.22,1,.36,1)`, staggered 80 ms apart, driven by a step counter ticking every 320 ms.
- **Wordmark** — "listen", Inter Tight 600, 40px, `-0.02em`, `#E8EAF0`. Fades in at step 4 over 600 ms.
- **Tagline** — "Your reading list, out loud.", Inter 400 16px, `#9BA3B4`.
- **Progress line** — 140×2px, `#1F2638` track, `#6366F1` fill, width `min(100, step × 20)%`, 300 ms linear.
- **Status caption** — 12px, `0.08em`, uppercase, `#5C6478`. "Loading voices" (steps 0–2) → "Restoring your place" (3–4) → "Ready" (5+).

**Behaviour:** advances every 320 ms; after step 6 navigates on (mobile → dashboard, web → landing). Tap anywhere to skip. Total ~2.2 s.

### 2. Dashboard (hero screen)

**Purpose:** resume, or start something new.

**Layout:** vertical scroll, 20px horizontal padding, 140px bottom padding to clear the player.

- **Welcome** — "Welcome back, {name}", Inter Tight 600 26px `-0.02em`. Sub: "Pick up where you left off, or start something new.", 15px `#9BA3B4`. 24px below.
- **Quick actions** — 2-column grid, 12px gap.
  - *Continue reading* spans both columns. Background `#6366F1`, radius 12px, padding 16px. 44px circular icon well at `rgba(255,255,255,.16)` with a play glyph; title 15px/600; subtitle = document title + " · N% through" at 13px `rgba(255,255,255,.75)`; chevron at right.
  - *New reading* and *Upload document* — `#111727`, 1px `#1F2638`, radius 12px, padding 16px, 20px icon in `#9BA3B4` above a 14px/500 label. Hover → `#1A2235`.
- **Recent reads** — section header Inter Tight 600 18px with a "See all" link in `#6366F1` 13px. Three cards, 10px gap: title 15px/600, 2-line clamped preview 13px `#9BA3B4`, heart icon in `#6366F1` if favourited, a 3px progress bar (`#1F2638` track / `#6366F1` fill), and a meta row "62% · 8m 12s · Today" at 12px `#5C6478` tabular-nums.
- **Statistics** — 2×2 grid of `#111727` cards: value in JetBrains Mono 600 24px tabular-nums, label 12px `#9BA3B4`. Values: Documents 14, Listening time 6h 42m, Completed 9, Pages read 128.
- **Chart** — "Minutes listened, last 14 days". 14 bars, flex:1 each, 5px gap, 64px tall (88px on desktop), radius 3px. Height = `max(4, value / max × 64)`px. Last bar `#6366F1`, zero-value bars `#1F2638`, rest `#2D3650`. Axis labels 11px `#5C6478`. Data: `[12,26,0,18,34,41,22,8,0,29,47,38,55,31]`.

### 3. New reading

**Purpose:** compose or paste text and configure the voice.

- **Title input** — full width, padding 13/14px, radius 8px, `#111727` on 1px `#1F2638`, Inter Tight 600 16px. Focus border `#6366F1`. Placeholder "Enter document title".
- **Textarea** — 180px tall (380px desktop), radius 8px, Inter 15px, line-height 1.6, no resize. Placeholder "Paste or type the text you want read aloud."
- **Counter row** — "{chars} characters · {words} words", JetBrains Mono 12px `#5C6478` tabular-nums, thousands-separated. Beside it: Copy, Save, Clear icon buttons (32px, radius 6px, 1px `#1F2638`); Clear turns `#EF4444` on hover.
- **Voice list** — section label 12px `0.08em` uppercase `#5C6478`. Four rows: 28px circular avatar with the voice's initial, name 14px/500, note 12px `#5C6478`, check icon when selected. Selected row: background `rgba(99,102,241,.10)`, border `#6366F1`.
- **Speed** — slider, 7 discrete steps `[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]`, accent `#6366F1`. Current value shown top-right in JetBrains Mono 13px. Ticks below: 0.5x / 1x / 2x.
- **Tone** — pill chips, radius 999px, padding 8/14px: Professional, Friendly, Calm, Energetic, Storytelling, Educational. Selected: `rgba(99,102,241,.10)` on `#6366F1`. Caption below: "Tone options come from the selected voice model."
- **Chunking notice** — appears when characters > 900. `#111727` card, 1px `#2D3650`, layers icon: "This text is longer than one request allows. It will be split into **N segments** at paragraph breaks and played back as one continuous session." N = `max(2, ceil(chars / 900))`.
- **Generate button** — full width, 15px padding, radius 8px, `#6366F1`, 15px/600 white. While generating: background `#2D3650`, opacity 0.7, label "Generating your audio", disabled. A 4px progress bar and "Segment N of 3 · P%" appear beneath.

### 4. Reader (the important one)

**Purpose:** listen while following the text.

- **Meta line** — voice name · "Segment N of 3", 12px `0.08em` uppercase `#5C6478`.
- **Sentence list** — one block per sentence, 6px gap. Padding `6px 10px 6px 14px`, radius 8px. A 2px full-height bar sits at the left edge of the active sentence.

| State | Text colour | Background | Left bar |
|---|---|---|---|
| Already read | `#5C6478` | transparent | none |
| **Active** | `#E8EAF0` | `rgba(99,102,241,.10)` | `#6366F1` |
| Not yet read | `#9BA3B4` | transparent | none |

  Transition: `background 200ms cubic-bezier(.4,0,.2,1), color 200ms`. Tapping a sentence seeks the audio to its start time.
- **Auto-scroll** — when the active index changes *and* audio is playing, scroll so the active sentence sits ~40% down the viewport, smoothly. Do not scroll while paused (the user may be reading ahead).
- **Display controls** — pill buttons: Focus mode, A−, A+, Line spacing, Width. Font size 14–26px step 2; line-height 1.4–2.2 step 0.2; width cycles 72→100% (mobile) or 520–880px (desktop).
- **Focus mode** — hides the header, sidebar and player chrome; text only, with a single exit control.

### 5. Library

- **Search** — 12px padding, 38px left inset for the icon, radius 8px. Placeholder "Search documents".
- **Filter chips** — All, Recent, Favourites, In progress, Completed. Horizontally scrollable on mobile; selected chip `rgba(99,102,241,.10)` on `#6366F1`.
- **Cards** — one column on mobile, 3-up grid on desktop. Tag label 12px `0.08em` uppercase; audio-lines icon in `#6366F1` when audio exists; heart toggle (`#6366F1` on, `#5C6478` off); title 15–16px/600; 2–3-line clamped preview; status line — "Not started" `#5C6478` / "In progress N%" `#9BA3B4` / "Completed" `#10B981` — then duration and date. Actions: primary button labelled "Listen" / "Continue from N%" / "Listen again", plus rename and delete icon buttons.
- **Empty state** — a single stone (38×6px `#2D3650` bar), the line "Nothing here yet. Your first document goes here.", and a "Clear filters" button. *This is the Cairn empty-cairn metaphor — one stone, calm caption, never a sad illustration.*

### 6. Saved audio

Rows: 38–40px circular play button (1px `#2D3650`), title 14–15px/500, meta "8m 12s · Aria · Today" in JetBrains Mono 12px `#5C6478`, download icon at right. Tapping play opens the reader and starts playback.

### 7. Upload

Three states in sequence:
1. **Idle** — dashed 1px `#2D3650` drop zone, radius 12px, 44px vertical padding (72px desktop): file-up icon in `#6366F1`, "Choose a file" / "Drop a file here, or choose one", "TXT, PDF or DOCX · up to 20 MB". Below: a "Recently uploaded" list.
2. **Uploading** — filename, percentage in JetBrains Mono, 4px progress bar, status text "Uploading file" (<55%) → "Extracting text from 9 pages".
3. **Done** — success card, 1px `#10B981`, check icon: "Extracted **4,180 words** from 9 pages. Review the text, then generate audio." Primary button "Open in editor".

### 8. Settings

Grouped `#111727` cards with 1px `#1F2638` dividers.
- **Reading** — three sliders: Text size (14–26px), Line spacing (1.40–2.20), Reading width. Current value right-aligned in JetBrains Mono.
- **Playback** — four toggles. Track 40×24px radius 999px, `#6366F1` on / `#2D3650` off, 20px white knob, 150 ms transition. Rows: "Continue to next segment" (default on), "Scroll to the active sentence" (on), "Remember where you stopped" (on), "Download over Wi-Fi only" (off) — each with a one-line note.
- **Account** — avatar, name, email, and a `#EF4444` "Log out" button.

### 9. Auth (mobile) / Login, signup, forgot (web)

One component, three modes.

| Mode | Title | Sub | CTA | Switch |
|---|---|---|---|---|
| login | Welcome back | Sign in to pick up where you left off. | Sign in | New here? → Create an account |
| signup | Create your account | Twenty thousand characters a month, free. No card needed. | Create account | Already have an account? → Sign in |
| forgot | Reset your password | Enter your email and we will send you a reset link. | Send reset link | Remembered it? → Back to sign in |

Signup adds a Name field. Forgot hides the password field and the social button. Inputs: 13–14px padding, radius 8px, `#111727` on 1px `#1F2638`, focus `#6366F1`.

**Validation:** empty email → "Enter your email address"; failing `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` → "That does not look like an email address" (both inline, `#F59E0B`, border turns `#F59E0B`); signup password under 8 characters → error toast "Passwords need at least 8 characters".

The desktop version is two columns: form left, a `#111727` panel right listing what an account holds (library, reading progress, generated audio, private by default) with iOS/Android buttons beneath.

### 10. Landing page (web only)

Sections top to bottom:
1. **Sticky nav**, 68px — logo, centred anchors (How it works, Features, Apps), Sign in (outline) and Create account (indigo).
2. **Hero**, 96px top padding, `1.05fr / .95fr` grid, 64px gap. Kicker 12px uppercase; headline Inter Tight 600 **56px** `-0.03em` — "The reading you keep meaning to do, read aloud."; 19px body capped at 520px; primary "Start listening free" with arrow, secondary "Try the demo"; footnote "Free for the first 20,000 characters a month. No card." Right column is a `#111727` card showing three sentences with the middle one in the active-highlight treatment, plus a mock player.
3. **How it works** — three numbered `#111727` cards (01/02/03 in JetBrains Mono `#6366F1`).
4. **Features** — 3×2 grid, 20px Lucide icon in `#9BA3B4` above a 16px/600 title and 15px body.
5. **Apps** — `#111727` panel, radius 16px, 48px padding, with the two store buttons.
6. **Closing CTA** — centred, Inter Tight 600 36px.
7. **Footer** — 1px `#1F2638` top border, 13px `#5C6478` links.

---

## Interactions & behaviour

### Playback (currently simulated)

```js
// 100 ms tick while playing
elapsed += 0.1 * speed;
if (elapsed >= total) { elapsed = total; playing = false; }
```

Sentence timing model — **replace this the moment the provider returns real timings**:

```js
const WPM = 165;
durations = sentences.map(s => Math.max(1.6, (wordCount(s) / WPM) * 60));
total     = sum(durations);
startOf(i) = sum(durations.slice(0, i));
sentenceIndex() = first i where elapsed < cumulative(i);
```

Keep this behind a single module (`lib/timing.js`) so real word/sentence timestamps swap in without touching any screen.

### Controls

| Control | Behaviour |
|---|---|
| Play / pause | toggles `playing` |
| Stop | `playing = false; elapsed = 0` |
| Previous / next | seek to `startOf(index ∓ 1)` — **sentence-level, not track-level** |
| Seek bar | `elapsed = total × (tapX / barWidth)` |
| Speed | cycles the 7-step array; affects both playback rate and estimated timings |
| Sentence tap | `elapsed = startOf(i)` |
| Download / favourite | success toast |

### Generation flow

1. Guard: already generating → no-op (prevents duplicate requests).
2. Empty text → error toast "Add some text before generating audio".
3. Over 20,000 characters → error toast "That is over the 20,000 character limit for one document".
4. Otherwise: progress 0→100 in steps of 7 every 130 ms (stand-in for real per-segment progress), then navigate to the reader, start playing, and show a success toast "Audio ready".

### Toasts

Bottom-anchored, radius 12px, `#1A2235`, 1px border, 300 ms `cubic-bezier(.22,1,.36,1)` entrance, auto-dismiss after 3.2 s. Icon and border by kind: info → `info` / `#2D3650` / `#9BA3B4`; success → `check` / `#10B981`; error → `alert-triangle` / `#F59E0B`.

### Error states to build for real

Empty text · text over limit · invalid API key · provider unavailable · network failure · unsupported voice · unsupported or corrupt file · file too large. Log details server-side; show the user a plain sentence. Never surface a stack trace or provider error verbatim.

### Motion

| Event | Duration | Easing |
|---|---|---|
| Hover / focus | 150 ms | `cubic-bezier(.4,0,.2,1)` |
| Tap feedback | 200 ms | `cubic-bezier(.4,0,.2,1)` |
| Dialog / drawer | 300 ms | `cubic-bezier(.22,1,.36,1)` |
| Screen entrance | 400 ms | `cubic-bezier(.22,1,.36,1)` |
| Splash showcase | 600 ms | `cubic-bezier(.22,1,.36,1)` |

No bounce, no overshoot, no spring, no spinner. `prefers-reduced-motion` / RN's `isReduceMotionEnabled` disables entrance and decorative motion; opacity state changes stay.

---

## State

**Global (survives navigation — put in a store):**

```
playing, elapsed, speed, voice, tone,
currentDocId, currentDocTitle, hasAudio, segment
fontSize, lineHeight, measure, focus       // reading preferences, persisted
switches: { autoContinue, followText, resume, wifiOnly }
```

**Per-screen (local):** `text`, `docTitle`, `generating`, `genPct`, `query`, `filter`, `uploadStage`, `uploadPct`, `authMode`, form fields, `toast`.

**Persisted server-side:** documents, audio records, reading progress, favourites, settings.

Suggested tables:

```
User             id, name, email, createdAt
Document         id, userId, title, content, wordCount, charCount, createdAt, updatedAt
Audio            id, documentId, voice, speed, tone, url, duration, segmentIndex, createdAt
ReadingProgress  id, userId, documentId, position, percentage, sentenceIndex, updatedAt
Favourite        userId, documentId
```

## API contract

```
GET  /api/voices                     → [{ id, name, note, lang, tones[] }]
POST /api/tts/generate               { text, voice, speed, lang }
                                     → audio/mpeg bytes (or { audioUrl, duration } once stored)
GET  /api/documents                  → [Document]
POST /api/documents                  { title, content } → Document
GET  /api/documents/:id
PATCH/DELETE /api/documents/:id
POST /api/documents/:id/audio        → generates + stores segments
POST /api/upload                     multipart → { text, wordCount, pageCount }
PUT  /api/reading-progress           { documentId, position, percentage, sentenceIndex }
```

Env (server only):

```env
TTS_API_KEY=UAPI-...                       # rotate before launch — see warning below
TTS_API_URL=https://ttsreader.com/api
TTS_DEFAULT_LANG=en-US
TTS_QUALITY=48khz_192kbps
DATABASE_URL=
STORAGE_BUCKET=
```

Isolate the provider behind `lib/tts.js` — included in this bundle, written against the real TTSReader contract — exposing `generateSpeech(text, voice, options)`, `getVoices()`, `resolveVoice(id)` and `generateDocument(chunks, voice)`. Swapping providers means rewriting that one file. `lib/api-tts-generate.route.js` is the matching Next.js route handler, including the error-code → friendly-message mapping.

**Voices come from `GET /api/voices` — never hard-coded in the app.** TTSReader takes a voice *name* ("Nova Premium") rather than an id and publishes no list endpoint, so the catalogue lives server-side in `lib/tts.js` and is served from that route. Confirm the names available on your plan; the four in the file are placeholders matching the prototype's demo voices.

### Provider: TTSReader

```
POST https://ttsreader.com/api/ttsSync
Authorization: Bearer $TTS_API_KEY
Content-Type: application/json

{ "text": "...", "lang": "en-US", "voice": "Nova Premium",
  "rate": 1, "quality": "48khz_192kbps" }

→ binary audio/mpeg (an MP3 body, not JSON)
```

Notes that shape the implementation:

- **The response is audio bytes, not a URL.** Your backend must persist the MP3 to object storage and hand the client a URL, or stream it through for short text. Nothing else works for a mobile player.
- **No timestamps.** `ttsSync` returns audio only, so sentence highlighting stays on the word-count estimate in `lib/timing.js`. `createTiming()` already accepts a `timings` array — pass real ones the day a provider supplies them and highlighting becomes exact with no screen changes.
- **`rate` maps 1:1** onto the UI's speed steps `[0.5 … 2]`. Because the provider bakes the rate into the audio, changing speed mid-document requires regenerating — or set `rate: 1` at generation and use the player's own playback-rate control instead. **Prefer the latter:** generate once at 1×, let `react-native-track-player` change speed, and scale the estimated durations by the player rate.
- **`quality: "48khz_192kbps"`** is generous for speech. Consider a lower bitrate for mobile downloads.
- **Character limit** — `CHAR_LIMIT` in `lib/tts.js` is set to 4000 as a safe default. Confirm the real ceiling for your plan and update that one constant; `chunkDocument()` reads it.

> ### ⚠ Rotate the API key
> The key `UAPI-cRBeyx8s8TSjtw1XPuSt` was shared in a chat message and must be considered compromised. Rotate it in the TTSReader dashboard and put the new one only in a server environment variable. It must never appear in the Expo bundle, in client JavaScript, in a committed `.env`, or in a prototype file — anything shipped to a device is readable.

### Long documents

Never send a whole document in one request. Split at paragraph boundaries first, sentence boundaries only if a paragraph still exceeds the limit. Generate per segment, store each with its `segmentIndex`, and have the player advance seamlessly — the user should experience one continuous session. The prototype's 900-character threshold is a demo value; use the real provider limit.

---

## Design tokens

**Colour**

| Role | Hex |
|---|---|
| Page background | `#0B0F19` |
| Card background | `#111727` |
| Hovered card | `#1A2235` |
| Primary text | `#E8EAF0` |
| Secondary text | `#9BA3B4` |
| Tertiary text | `#5C6478` |
| **Accent (indigo)** | `#6366F1` |
| Accent hover | `#7C7FF2` |
| Accent wash (active sentence) | `rgba(99,102,241,.10)` |
| Success | `#10B981` |
| Caution | `#F59E0B` |
| Danger | `#EF4444` |
| Border quiet | `#1F2638` |
| Border strong | `#2D3650` |

**One accent.** If indigo appears more than twice on a screen, audit the design. No gradients. No decorative shadows — hierarchy comes from the background ladder `#0B0F19 → #111727 → #1A2235`. No glassmorphism, no background images or textures. Every border is 1px.

**Type** — Inter Tight 600 for display/headings (tight tracking), Inter 400/500/600 for body (line-height 1.6), JetBrains Mono for numerals. `font-variant-numeric: tabular-nums` on **every** number that ticks or compares — timers, percentages, counts, durations.

Scale: display 64 / h1 48 / h2 36 / h3 24 / body-lg 19 / body 16 / body-sm 14 / caption 12. Mobile: display 40 / h1 32 / h2 28. Minimum touch target 44px.

**Spacing** — 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 160. No intermediates. 24–32 within a group, 48–64 between groups, 96+ between major sections.

**Radius** — buttons 6 · inputs 8 · cards 12 · surfaces 16 · pills 999.

## Voice & copy

Calm, direct, evidence-grounded. Sentence case everywhere including buttons. **No exclamation points. No emoji.** ALL CAPS only in the 12px `0.08em` caption style. Bold is rare — structure earns emphasis. Address the user as "you"; the product rarely refers to itself. Numbers do the work: "45m budgeted · 0m elapsed", not "You're doing great".

All copy in the prototypes is final — lift it verbatim.

## Assets

- **Icons** — Lucide, 1.5–2px stroke, round caps and joins, colour inherited. The prototypes inline an SVG sprite of the subset used; in RN use `lucide-react-native`, on web use `lucide-react`. Every icon-only control needs an `aria-label` / `accessibilityLabel`.
- **Logo** — the "listen" mark is three stacked indigo bars (8/14/20px wide, 3px tall, 2px gap, 2px radius) beside the lowercase wordmark in Inter Tight 600. Trivial to redraw; no asset file needed.
- **Store badges** — placeholders. Replace with Apple's and Google's official artwork.
- **Fonts** — Inter, Inter Tight, JetBrains Mono. The prototypes load them from Google Fonts; bundle them with `expo-font` in the app.
- No photography, no illustration, no mascots.

## Accessibility

- Every icon-only control carries `accessibilityLabel`.
- Player controls reachable and operable by keyboard on web; `accessibilityRole="button"` in RN.
- Focus ring: 2px `#6366F1`, 2px offset, always visible on keyboard focus.
- Text size is user-controllable (14–26px) and must not clip layout at the maximum.
- Contrast: `#9BA3B4` on `#111727` passes AA for body; never go below `#5C6478` for anything a user must read.
- Announce playback state changes to screen readers; don't rely on colour alone for the active sentence — the left bar carries it too.

## Files in this bundle

- `TTS Reader.dc.html` — mobile prototype (all 9 screens, iPhone frame)
- `listen - Desktop.dc.html` — landing page, auth, and desktop app shell
- `ios-frame.jsx` — device bezel used by the mobile prototype (reference only, not needed in the app)
- `support.js` — the prototype runtime (reference only, not needed in the app)
- `lib/timing.js` — sentence splitting, duration estimation, active-sentence lookup, speed steps, `mm:ss` formatting, paragraph-first document chunker. Portable, no dependencies.
- `lib/theme.js` — Cairn design tokens as a React Native theme.
- `lib/tts.js` — **server-only** TTSReader service: `generateSpeech`, `getVoices`, `resolveVoice`, `generateDocument`, typed `TTSError`.
- `lib/api-tts-generate.route.js` — Next.js App Router handler for `POST /api/tts/generate`, with friendly error mapping.

To view: open either `.dc.html` in a browser. Both are fully interactive.

## Build order

1. Theme file + fonts + icon set.
2. Navigation shell and the nine routes as empty screens.
3. `lib/timing.js` and the player store, driven by the fake timer — the reader works end to end before any audio exists.
4. Reader screen with highlighting and auto-scroll (the hardest piece; `onLayout` per sentence to capture offsets).
5. Backend: `/api/voices` and `/api/tts/generate` against TTSReader using the included `lib/tts.js`. Store returned MP3s in object storage and return URLs.
6. Swap the fake timer for `react-native-track-player`; wire real timings into `lib/timing.js` if available.
7. Persistence: documents, progress, favourites.
8. Upload + server-side extraction; chunking.
9. Auth.
10. Error states, empty states, toasts, accessibility pass.
