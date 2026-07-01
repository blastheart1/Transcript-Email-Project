// Core domain types for Relay, shared between client and API routes.

export type NoteStatus = "transcribing" | "ready" | "sent" | "error" | "needs_review";

export type Severity = "high" | "medium" | "low";

/** A claim/entity in the draft not supported by the transcript. */
export interface Fabrication {
  text: string;
  severity: Severity;
  why: string;
}

/** Result of the faithfulness audit (deterministic checks + cross-model auditor). */
export interface Verdict {
  faithful: boolean;
  meaningPreserved: boolean;
  /** 0..1 — how accurately the draft reflects the transcript's facts + intent. */
  accuracy: number;
  fabrications: Fabrication[];
  omissions: string[];
  /** Inferred spans that should have been flagged but weren't. */
  unflaggedGuesses: string[];
  styleScore: number; // 0..1
  styleNotes: string;
  auditorProvider?: string;
  auditorModel?: string;
  /** How many draft attempts ran (1 = no repair; >1 = reprocessed). */
  attempts?: number;
  /** True if a stricter repair pass ran before this verdict. */
  repaired?: boolean;
  /** Set when attempts were exhausted — e.g. likely source voice-note quality. */
  reviewNote?: string;
}

/** A persisted style sample (id + the StyleSample fields from constants). */
export interface StyleSampleRecord {
  id: string;
  title: string;
  body: string;
}

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
  /** Optional CC / BCC recipients — comma-separated, user-managed. */
  cc?: string;
  bcc?: string;
  /** Original recording, kept client-side as an object URL when available. */
  audioURL?: string | null;
  segments?: TranscriptSegment[];
  /** Email body as paragraphs of (possibly flagged) runs. */
  paragraphs: BodySegment[][];
  assumptions: Assumption[];
  tone?: Tone;
  length?: Length;
  /** Which model/provider produced the current draft (for display). */
  model?: string;
  provider?: string;
  /** Faithfulness audit result, stored with the note. */
  verdict?: Verdict;
  /** Hidden from the default inbox when true. */
  archived?: boolean;
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
  /** When present, this is a stricter repair pass targeting prior audit findings. */
  repair?: {
    fabrications: string[];
    omissions: string[];
    unflaggedGuesses: string[];
  };
}

export interface DraftResponse {
  type: NoteType;
  person: string;
  toEmail: string;
  subject: string;
  paragraphs: BodySegment[][];
  assumptions: Assumption[];
}
