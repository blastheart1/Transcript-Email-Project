import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function hasAnthropic(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Lazily construct a shared Anthropic client; throws if unconfigured. */
export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export const ANTHROPIC_DRAFT_MODEL =
  process.env.ANTHROPIC_DRAFT_MODEL || "claude-sonnet-4-6";
