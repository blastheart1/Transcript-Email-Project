import { NextResponse } from "next/server";
import { transcribeAudio, MAX_AUDIO_BYTES } from "@/lib/transcribe";
import { runDraftPipeline } from "@/lib/pipeline";
import { buildEmailHtml } from "@/lib/emailHtml";
import { bodyText } from "@/lib/format";
import { STYLE_SAMPLES, DEFAULT_SIGN_OFF, DEFAULT_TONE, DEFAULT_LENGTH, SENDER } from "@/lib/constants";
import { getSettings } from "@/lib/db/settings.repo";
import { listStyleSamples } from "@/lib/db/style-samples.repo";
import { createNote } from "@/lib/db/notes.repo";
import type { Note, Tone, Length } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const isTone = (v: unknown): v is Tone => v === "Warm" || v === "Neutral" || v === "Direct";
const isLength = (v: unknown): v is Length =>
  v === "Concise" || v === "Standard" || v === "Detailed";

/** Shared-secret guard: DB secret takes precedence, env var is a fallback. */
function authorized(request: Request, url: URL, dbSecret: string | null): boolean {
  const secret = dbSecret || process.env.RELAY_INGEST_SECRET || "";
  if (!secret) return true; // open when no secret configured
  const provided = request.headers.get("x-relay-secret") || url.searchParams.get("secret");
  return provided === secret;
}

/**
 * Webhook ingest — the end-to-end automation entry point.
 *
 * Accepts EITHER multipart/form-data with an `audio` file, OR JSON
 * { audioUrl, fileName?, tone?, length?, model? }. Also accepts a JSON
 * { ping: true } connectivity check. Runs Whisper → drafting, PERSISTS the draft
 * as an inbox note, and returns the transcript, structured draft, and HTML email.
 * Designed for a Zapier "Webhooks by Zapier" POST triggered by a new Google Drive file.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  // Settings gate (enabled + secret) — managed from the app's Settings screen.
  let dbSecret: string | null = null;
  let enabled = true;
  try {
    const settings = await getSettings();
    dbSecret = settings.webhookSecret;
    enabled = settings.webhookEnabled;
  } catch {
    /* if settings can't load, fall back to env-secret behavior */
  }

  if (!authorized(request, url, dbSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!enabled) {
    return NextResponse.json({ error: "Webhook is disabled." }, { status: 403 });
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
        ping?: boolean;
        audioUrl?: string;
        fileName?: string;
        tone?: unknown;
        length?: unknown;
        model?: unknown;
      };
      if (json.ping) {
        return NextResponse.json({ ok: true, enabled, secured: !!dbSecret });
      }
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

    // 2) Draft + faithfulness pipeline (DB style samples if present)
    const dbStyles = await listStyleSamples().catch(() => []);
    const styleSamples = dbStyles.length ? dbStyles.map((s) => s.body) : STYLE_SAMPLES.map((s) => s.body);
    const result = await runDraftPipeline({
      transcript: t.transcript,
      segments: t.segments,
      tone,
      length,
      styleSamples,
      signOff: DEFAULT_SIGN_OFF,
      senderName: SENDER.name,
      model,
    });
    const draft = result.draft;

    // 3) Persist as an inbox note so it surfaces in the app
    const saved = await createNote({
      person: draft.person || "New recipient",
      type: draft.type,
      subject: draft.subject,
      status: result.status,
      received: "Just now",
      duration: t.duration,
      transcript: t.transcript,
      toEmail: draft.toEmail,
      segments: t.segments,
      paragraphs: draft.paragraphs,
      assumptions: draft.assumptions,
      tone,
      length,
      model: result.model,
      provider: result.provider,
      verdict: result.verdict,
      source: "webhook",
    });

    // 4) Render the send-ready email
    const note: Note = { ...saved };

    return NextResponse.json({
      noteId: saved.id,
      status: result.status,
      verdict: result.verdict,
      transcript: t.transcript,
      duration: t.duration,
      segments: t.segments,
      draft: {
        provider: result.provider,
        model: result.model,
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
