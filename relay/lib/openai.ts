import OpenAI from "openai";

let client: OpenAI | null = null;

/** Lazily construct a shared OpenAI client; throws a clear error if unconfigured. */
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }
  if (!client) client = new OpenAI({ apiKey });
  return client;
}

export const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";
/** Default transcription language. English unless explicitly overridden. */
export const TRANSCRIBE_LANGUAGE = process.env.OPENAI_TRANSCRIBE_LANGUAGE || "en";
export const DRAFT_MODEL = process.env.OPENAI_DRAFT_MODEL || "gpt-4o";
