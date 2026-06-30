import type { DraftProvider } from "./types";

export interface ModelOption {
  id: string;
  label: string;
  provider: DraftProvider;
  hint?: string;
}

/** Curated drafting models the user can pick from the dropdown. */
export const MODELS: ModelOption[] = [
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", hint: "Balanced, default" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", provider: "openai", hint: "Fast & cheap" },
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai", hint: "Stronger reasoning" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", hint: "Great writer" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "anthropic", hint: "Most capable" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", hint: "Fast & cheap" },
];

export const DEFAULT_MODEL_ID = "gpt-4o";

export function modelById(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}

export function providerForModel(id: string): DraftProvider {
  return modelById(id)?.provider ?? (id.startsWith("claude") ? "anthropic" : "openai");
}
