/**
 * listen — local-disk audio storage (SERVER ONLY)
 *
 * Saves generated MP3s under /public/audio so Next.js serves them as static
 * files at the same relative URL. Fine for local dev / single-server
 * deployments; swap for an object-storage bucket (S3/R2) before scaling out
 * to multiple instances, since /public isn't shared across them.
 */

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

fs.mkdirSync(AUDIO_DIR, { recursive: true });

/**
 * @param {Buffer} buffer
 * @returns {{ url: string, filePath: string }}
 */
export function saveAudioFile(buffer) {
  const filename = `${randomUUID()}.mp3`;
  const filePath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return { url: `/audio/${filename}`, filePath };
}

export function deleteAudioFile(filePath) {
  fs.rm(filePath, { force: true }, () => {});
}
