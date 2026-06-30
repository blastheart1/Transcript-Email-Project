import { NextResponse } from "next/server";
import { transcribeAudio, MAX_AUDIO_BYTES } from "@/lib/transcribe";
import { generateDraft } from "@/lib/draftEngine";
import { buildEmailHtml } from "@/lib/emailHtml";
import { bodyText } from "@/lib/format";
import { STYLE_SAMPLES, DEFAULT_SIGN_OFF, DEFAULT_TONE, DEFAULT_LENGTH, SENDER } from "@/lib/constants";
import type { Note, Tone, Length } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const isTone = (v: unknown): v is Tone => v === "Warm" || v === "Neutral" || v === "Direct";
const isLength = (v: unknown): v is Length =>
  v === "Concise" || v === "Standard" || v === "Detailed";

/** Optional shared-secret guard for the public webhook. */
function authorized(request: Request, url: URL): boolean {
  const secret = process.env.RELAY_INGEST_SECRET;
  if (!secret) return true; // open in dev / when unset
  const provided = request.headers.get("x-relay-secret") || url.searchParams.get("secret");
  return provided === secret;
}

/**
 * Webhook ingest — the end-to-end automation entry point.
 *
 * Accepts EITHER:
 *   • multipart/form-data with an `audio` file (+ optional tone/length/model), or
 *   • application/json: { audioUrl, fileName?, tone?, length?, model? }
 *
 * Runs Whisper → drafting and returns the transcript, structured draft, and a
 * ready-to-send HTML email. Designed for a Zapier "Webhooks by Zapier" POST step
 * triggered by a new recording in a Google Drive folder.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!authorized(request, url)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let buffer: Buffer;
    let name = "voice-note.m4a";
    let type = "audio/m4a";
    let tone: Tone = DEFAULT_TONE;
    let length: Length = DEFAULT_LENGTH;
    let model: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("audio");
      if (!(file instanceof Blob)) {
        return NextResponse.json({ error: "No `audio` file in the form." }, { status: 400 });
      }
      buffer = Buffer.from(await file.arrayBuffer());
      name = (file as File).name || name;
      type = file.type || type;
      const t = form.get("tone");
      const l = form.get("length");
      const m = form.get("model");
      if (isTone(t)) tone = t;
      if (isLength(l)) length = l;
      if (typeof m === "string") model = m;
    } else {
      const json = (await request.json().catch(() => ({}))) as {
        audioUrl?: string;
        fileName?: string;
        tone?: unknown;
        length?: unknown;
        model?: unknown;
      };
      if (!json.audioUrl) {
        return NextResponse.json(
          { error: "Provide `audioUrl` (JSON) or an `audio` file (multipart)." },
          { status: 400 },
        );
      }
      const audioRes = await fetch(json.audioUrl);
      if (!audioRes.ok) {
        return NextResponse.json(
          { error: `Couldn't fetch audioUrl (${audioRes.status}).` },
          { status: 400 },
        );
      }
      const arr = await audioRes.arrayBuffer();
      if (arr.byteLength > MAX_AUDIO_BYTES) {
        return NextResponse.json({ error: "Audio is larger than 25 MB." }, { status: 413 });
      }
      buffer = Buffer.from(arr);
      name = json.fileName || json.audioUrl.split("/").pop()?.split("?")[0] || name;
      type = audioRes.headers.get("content-type") || type;
      if (isTone(json.tone)) tone = json.tone;
      if (isLength(json.length)) length = json.length;
      if (typeof json.model === "string") model = json.model;
    }

    // 1) Transcribe
    const t = await transcribeAudio(buffer, name, type);
    if (!t.transcript) {
      return NextResponse.json({ error: "Transcription produced no text." }, { status: 422 });
    }

    // 2) Draft (OpenAI primary, Anthropic fallback)
    const draft = await generateDraft({
      transcript: t.transcript,
      segments: t.segments,
      tone,
      length,
      styleSamples: STYLE_SAMPLES.map((s) => s.body),
      signOff: DEFAULT_SIGN_OFF,
      senderName: SENDER.name,
      model,
    });

    // 3) Render the send-ready email
    const note: Note = {
      id: "ingest",
      person: draft.person || "",
      type: draft.type,
      subject: draft.subject,
      status: "ready",
      received: "Just now",
      duration: t.duration,
      transcript: t.transcript,
      toEmail: draft.toEmail,
      segments: t.segments,
      paragraphs: draft.paragraphs,
      assumptions: draft.assumptions,
    };

    return NextResponse.json({
      transcript: t.transcript,
      duration: t.duration,
      segments: t.segments,
      draft: {
        provider: draft.provider,
        model: draft.model,
        type: draft.type,
        person: draft.person,
        toEmail: draft.toEmail,
        subject: draft.subject,
        paragraphs: draft.paragraphs,
        assumptions: draft.assumptions,
      },
      emailText: bodyText(note),
      emailHtml: buildEmailHtml(note),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Ingest failed.";
    const status = /API_KEY|provider configured/.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
