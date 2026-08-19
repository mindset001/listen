import { NextResponse } from "next/server";
import { getVoices } from "@/lib/tts";

export async function GET() {
  const voices = await getVoices();
  return NextResponse.json(voices);
}
