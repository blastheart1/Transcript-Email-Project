// Core domain types for Relay, shared between client and API routes.

export type NoteStatus = "transcribing" | "ready" | "sent" | "error";

export type NoteType = "Follow-up" | "Intro" | "Reply" | "Note";

export type Tone = "Warm" | "Neutral" | "Direct";

export type Length = "Concise" | "Standard" | "Detailed";

/** One time-stamped chunk of the transcript. */
export interface TranscriptSegment {
  time: string; // "m:ss"
  text: string;
}

/**
 * A run of body text. `flagged` runs are things Relay inferred or inserted
 * (a guessed date, a placeholder link) and are highlighted for review.
 */
export interface BodySegment {
  t: string;
  flagged?: boolean;
  tip?: string;
}

/** A line in the "What Relay changed & assumed" panel. */
export interface Assumption {
  t: string;
  flagged?: boolean; // true = needs a look, false = cleaned up automatically
  tip?: string;
}

export interface Note {
  id: string;
  person: string;
  type: NoteType;
  subject: string;
  status: NoteStatus;
  received: string;
  duration: string;
  transcript: string;
  toEmail: string;
  /** Original recording, kept client-side as an object URL when available. */
  audioURL?: string | null;
  segments?: TranscriptSegment[];
  /** Email body as paragraphs of (possibly flagged) runs. */
  paragraphs: BodySegment[][];
  assumptions: Assumption[];
  tone?: Tone;
  length?: Length;
  errorMessage?: string;
}

// ---- API payloads ----

export interface TranscribeResponse {
  transcript: string;
  duration: string;
  segments: TranscriptSegment[];
}

export type DraftProvider = "openai" | "anthropic";

export interface DraftRequest {
  transcript: string;
  segments?: TranscriptSegment[];
  tone: Tone;
  length: Length;
  styleSamples: string[];
  signOff: string;
  senderName: string;
  /** Optional user-selected model id (e.g. "gpt-4o", "claude-sonnet-4-6"). */
  model?: string;
}

export interface DraftResponse {
  type: NoteType;
  person: string;
  toEmail: string;
  subject: string;
  paragraphs: BodySegment[][];
  assumptions: Assumption[];
}
