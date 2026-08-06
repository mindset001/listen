/**
 * listen — SQLite persistence (SERVER ONLY)
 *
 * Single-file, zero-setup database. No real auth exists yet, so every
 * document belongs to the one implicit demo user shown in the UI — see
 * README "Build order" step 9 for wiring real accounts later.
 */

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "listen.sqlite");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const globalForDb = globalThis;

export const db = globalForDb.__listenDb || new Database(DB_PATH);
if (process.env.NODE_ENV !== "production") globalForDb.__listenDb = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    content        TEXT NOT NULL,
    word_count     INTEGER NOT NULL DEFAULT 0,
    char_count     INTEGER NOT NULL DEFAULT 0,
    tag            TEXT NOT NULL DEFAULT 'Document',
    fav            INTEGER NOT NULL DEFAULT 0,
    position       REAL NOT NULL DEFAULT 0,
    percentage     INTEGER NOT NULL DEFAULT 0,
    sentence_index INTEGER NOT NULL DEFAULT 0,
    voice          TEXT,
    speed          REAL,
    tone           TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audio (
    id            TEXT PRIMARY KEY,
    document_id   TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    voice         TEXT NOT NULL,
    speed         REAL NOT NULL,
    url           TEXT NOT NULL,
    file_path     TEXT NOT NULL,
    duration      REAL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_audio_document_id ON audio(document_id);
`);

seedDemoDocuments();

/** First-run only: populate a few sample documents so the app isn't empty. */
function seedDemoDocuments() {
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM documents`).get();
  if (n > 0) return;

  const SEED = [
    {
      title: "The quiet case for listening",
      tag: "Article",
      fav: 1,
      percentage: 62,
      daysAgo: 0,
      content:
        "There is a particular kind of tiredness that comes from reading on a screen all day. " +
        "It is not the tiredness of hard thinking. It is the tiredness of holding your eyes still. " +
        "Listening moves the work somewhere else. The words arrive at a steady pace, and your attention rides along with them instead of dragging itself forward. " +
        "This is why so many people who never finished a book on paper will finish four in a month once they start listening on the walk to work. " +
        "The interesting question is not whether listening counts as reading. It plainly does. " +
        "The interesting question is what changes about comprehension when the pace is set for you rather than by you. " +
        "Research on this is thinner than you would hope, and much of what circulates online is folklore. " +
        "What we can say with some confidence is that rereading is harder when listening, and that difficulty matters most for dense, technical material. " +
        "For narrative and argument, the difference all but disappears. " +
        "So the practical advice is unglamorous: listen to the things you would happily read on a train, and read the things you would need a pencil for. " +
        "Speed is the other lever. Most people settle somewhere between 1.2 and 1.5 times, and stay there. " +
        "Going faster feels productive for about a week, and then quietly stops working. " +
        "The point was never to get through more words. It was to get through the words without dreading them.",
    },
    {
      title: "Attention and pacing — Q3 research notes",
      tag: "Research",
      fav: 0,
      percentage: 24,
      daysAgo: 1,
      content:
        "Summary of twelve studies on auditory comprehension, with notes on which findings replicate and which do not. " +
        "Most of the effect sizes reported before 2020 shrink considerably under replication, though the direction of the effect usually holds. " +
        "The clearest signal across studies is that pacing control matters more than voice quality once a minimum bar of naturalness is cleared.",
    },
    {
      title: "Chapter 4 — Cellular respiration",
      tag: "Textbook",
      fav: 0,
      percentage: 100,
      daysAgo: 9,
      content:
        "Glycolysis, the citric acid cycle, and oxidative phosphorylation, with the diagrams described in text. " +
        "Glycolysis splits one molecule of glucose into two molecules of pyruvate, yielding a net gain of two ATP and two NADH. " +
        "The citric acid cycle then oxidises the resulting acetyl-CoA, releasing carbon dioxide and generating electron carriers for the final stage. " +
        "Oxidative phosphorylation uses those carriers to drive ATP synthase across the inner mitochondrial membrane, producing the bulk of a cell's usable energy.",
    },
    {
      title: "Onboarding email drafts v3",
      tag: "Draft",
      fav: 1,
      percentage: 0,
      daysAgo: 13,
      content:
        "Three variants of the welcome sequence. Read aloud to catch anything that sounds stiff. " +
        "Variant A leads with the product's core value proposition in the first line. " +
        "Variant B opens with a question. Variant C skips the pleasantries and goes straight to the first action we want the reader to take.",
    },
    {
      title: "Lease agreement — 14 Marlow St",
      tag: "Document",
      fav: 0,
      percentage: 88,
      daysAgo: 16,
      content:
        "Sections 1 through 9, including the break clause and the deposit schedule. " +
        "The tenant may terminate this agreement after month eighteen with sixty days' written notice, subject to the early-termination fee outlined in section 7. " +
        "The security deposit, held in a protected scheme, is returned within ten working days of the final inspection provided no damage beyond fair wear is recorded.",
    },
    {
      title: "Field notes — coastal erosion survey",
      tag: "Research",
      fav: 0,
      percentage: 41,
      daysAgo: 19,
      content:
        "Transect measurements from the March visit, plus the revised sampling plan for autumn. " +
        "Cliff retreat at marker four averaged 0.4 metres since the previous survey, consistent with the long-term trend for this stretch of coastline. " +
        "The revised fixed sampling plan increased transect count from six to nine to improve confidence intervals ahead of the winter storm season.",
    },
  ];

  const insert = db.prepare(
    `INSERT INTO documents (id, title, content, word_count, char_count, tag, fav, percentage, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))`
  );

  const insertMany = db.transaction((docs) => {
    for (const d of docs) {
      const offset = `-${d.daysAgo} days`;
      insert.run(
        randomUUID(),
        d.title,
        d.content,
        d.content.trim().split(/\s+/).length,
        d.content.length,
        d.tag,
        d.fav,
        d.percentage,
        offset,
        offset
      );
    }
  });

  insertMany(SEED);
}
