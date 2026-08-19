/**
 * listen — POST /api/upload
 *
 * Extracts text server-side from an uploaded TXT, PDF or DOCX file.
 * The client then edits/generates from the returned text like any other
 * "New reading" draft — this endpoint never touches the TTS provider.
 */

import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import path from "node:path";
import { wordCount } from "@/lib/timing";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB, matches the UI's stated limit

// pdf-parse (via pdfjs-dist) dynamically imports its worker relative to its
// own bundle location, which Next.js's server bundler doesn't preserve.
// require.resolve(literal) gets statically rewritten by Turbopack into its
// own internal module id (even via createRequire), so build the real
// on-disk path with plain string concatenation instead — matches the
// "legacy" build pdf-parse itself imports, so worker/main-thread API
// versions agree.
PDFParse.setWorker(
  path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")
);

export async function POST(request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "missing_file", message: "Choose a file to upload." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "too_large", message: "That file is over the 20 MB limit." },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();

  try {
    let text = "";
    let pageCount = 1;

    if (ext === "txt") {
      text = buffer.toString("utf-8");
    } else if (ext === "pdf") {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      text = result.text;
      pageCount = result.total || 1;
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: "unsupported", message: "Only TXT, PDF or DOCX files are supported." },
        { status: 415 }
      );
    }

    text = text.trim();
    if (!text) {
      return NextResponse.json(
        { error: "empty", message: "Could not find any text in that file." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text, wordCount: wordCount(text), pageCount });
  } catch (err) {
    console.error("[/api/upload]", err);
    return NextResponse.json(
      { error: "corrupt", message: "That file looks corrupt or unreadable." },
      { status: 422 }
    );
  }
}
