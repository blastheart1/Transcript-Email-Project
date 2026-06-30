import OpenAI from "openai";
import { getOpenAI, TRANSCRIBE_MODEL, TRANSCRIBE_LANGUAGE } from "./openai";
import { formatClock } from "./format";
import type { TranscribeResponse, TranscriptSegment } from "./types";

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // OpenAI hard limit

/** Merge Whisper's fine-grained segments into a few readable, timestamped chunks. */
export function groupSegments(
  raw: Array<{ start: number; text: string }>,
  targetSeconds = 13,
): TranscriptSegment[] {
  const out: TranscriptSegment[] = [];
  let bucketStart = 0;
  let buffer: string[] = [];
  for (const s of raw) {
    if (buffer.length === 0) bucketStart = s.start;
    buffer.push(s.text.trim());
    if (s.start - bucketStart >= targetSeconds) {
      out.push({ time: formatClock(bucketStart), text: buffer.join(" ").trim() });
      buffer = [];
    }
  }
  if (buffer.length) out.push({ time: formatClock(bucketStart), text: buffer.join(" ").trim() });
  return out;
}

/** Transcribe an audio buffer with Whisper (English by default). Shared by the
 *  /api/transcribe route and the /api/ingest webhook. */
export async function transcribeAudio(
  buffer: Buffer,
  name: string,
  type: string,
): Promise<TranscribeResponse> {
  if (buffer.byteLength === 0) throw new Error("The audio file is empty.");
  if (buffer.byteLength > MAX_AUDIO_BYTES) {
    throw new Error("Audio is larger than 25 MB. Try a shorter clip.");
  }

  const upload = await OpenAI.toFile(buffer, name || "voice-note.m4a", {
    type: type || "audio/m4a",
  });
  const openai = getOpenAI();
  const result = await openai.audio.transcriptions.create({
    file: upload,
    model: TRANSCRIBE_MODEL,
    language: TRANSCRIBE_LANGUAGE,
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const transcript = (result.text || "").trim();
  const rawSegments =
    (result as unknown as { segments?: Array<{ start: number; text: string }> }).segments ?? [];
  const durationSec =
    (result as unknown as { duration?: number }).duration ??
    (rawSegments.length ? rawSegments[rawSegments.length - 1].start + 3 : 0);

  return {
    transcript,
    duration: formatClock(durationSec),
    segments: rawSegments.length ? groupSegments(rawSegments) : [],
  };
}
