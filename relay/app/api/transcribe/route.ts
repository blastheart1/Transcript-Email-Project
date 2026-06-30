import { NextResponse } from "next/server";
import { transcribeAudio, MAX_AUDIO_BYTES } from "@/lib/transcribe";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio is larger than 25 MB. Try a shorter clip." },
        { status: 413 },
      );
    }
    const name = (file as File).name || "voice-note.m4a";
    const buffer = Buffer.from(await file.arrayBuffer());
    const payload = await transcribeAudio(buffer, name, file.type);
    return NextResponse.json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transcription failed.";
    const status = /OPENAI_API_KEY/.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
