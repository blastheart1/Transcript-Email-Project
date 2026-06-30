import type AnthropicSDK from "@anthropic-ai/sdk";
import { getOpenAI, DRAFT_MODEL } from "./openai";
import { getAnthropic, hasAnthropic, ANTHROPIC_DRAFT_MODEL } from "./anthropic";
import { buildSystemPrompt, buildUserPrompt, DRAFT_SCHEMA } from "./prompts";
import { providerForModel } from "./models";
import type {
  DraftRequest,
  DraftResponse,
  DraftProvider,
  BodySegment,
  Assumption,
} from "./types";

export interface DraftResult extends DraftResponse {
  provider: DraftProvider;
  model: string;
}

/** Strip schema-required empty `tip`/`flagged` noise so the UI gets clean runs. */
function tidySegments(rows: BodySegment[]): BodySegment[] {
  return rows.map((r) =>
    r.flagged ? { t: r.t, flagged: true, tip: r.tip || "Inferred — please confirm." } : { t: r.t },
  );
}
function tidyAssumptions(rows: Assumption[]): Assumption[] {
  return rows.map((r) =>
    r.flagged ? { t: r.t, flagged: true, tip: r.tip || "Worth a quick check." } : { t: r.t },
  );
}

const WEAK_SUBJECTS = new Set(["", "draft", "email", "subject", "note", "untitled"]);

/** Guarantee a usable subject even if the model returns nothing/weak. */
export function ensureSubject(raw: Partial<DraftResponse>): string {
  const s = (raw.subject || "").trim();
  if (s.length > 3 && !WEAK_SUBJECTS.has(s.toLowerCase())) return s;
  const type = raw.type ?? "Note";
  const person = (raw.person || "").trim();
  if (type === "Intro") return person ? `Intro: ${person}` : "Quick introduction";
  if (person) return `${type} for ${person}`;
  return type === "Reply" ? "Re: your note" : "Quick note";
}

/** Normalize a raw model object into a clean DraftResponse. Exported for tests. */
export function normalizeDraft(raw: Partial<DraftResponse>): DraftResponse {
  return {
    type: raw.type ?? "Note",
    person: raw.person || "",
    toEmail: raw.toEmail || "",
    subject: ensureSubject(raw),
    paragraphs: (raw.paragraphs || []).map(tidySegments),
    assumptions: tidyAssumptions(raw.assumptions || []),
  };
}

async function draftWithOpenAI(req: DraftRequest, model: string): Promise<DraftResponse> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      { role: "system", content: buildSystemPrompt(req) },
      { role: "user", content: buildUserPrompt(req) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "relay_draft", strict: true, schema: DRAFT_SCHEMA },
    },
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no draft.");
  return normalizeDraft(JSON.parse(content) as DraftResponse);
}

async function draftWithAnthropic(req: DraftRequest, model: string): Promise<DraftResponse> {
  const anthropic = getAnthropic();
  // Claude returns structured output via a forced tool call.
  const message = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: buildSystemPrompt(req),
    messages: [{ role: "user", content: buildUserPrompt(req) }],
    tools: [
      {
        name: "relay_draft",
        description: "Return the drafted email in Relay's structured format.",
        input_schema: DRAFT_SCHEMA as unknown as AnthropicSDK.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "relay_draft" },
  });
  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("Claude returned no draft.");
  return normalizeDraft(toolUse.input as DraftResponse);
}

/**
 * Generate a draft. Honors the user-selected `model` (and its provider). If the
 * chosen provider fails — or has no key — falls back to the other provider when
 * its key is present. Throws only if no provider can run.
 */
export async function generateDraft(req: DraftRequest): Promise<DraftResult> {
  const haveOpenAI = !!process.env.OPENAI_API_KEY;
  const requested = req.model;
  const desired: DraftProvider = requested ? providerForModel(requested) : "openai";

  const openaiModel = desired === "openai" && requested ? requested : DRAFT_MODEL;
  const anthropicModel = desired === "anthropic" && requested ? requested : ANTHROPIC_DRAFT_MODEL;

  const tryOpenAI = async (): Promise<DraftResult> => ({
    ...(await draftWithOpenAI(req, openaiModel)),
    provider: "openai",
    model: openaiModel,
  });
  const tryAnthropic = async (): Promise<DraftResult> => ({
    ...(await draftWithAnthropic(req, anthropicModel)),
    provider: "anthropic",
    model: anthropicModel,
  });

  const order: DraftProvider[] = desired === "anthropic" ? ["anthropic", "openai"] : ["openai", "anthropic"];

  let lastError: unknown;
  for (const provider of order) {
    if (provider === "openai" && !haveOpenAI) continue;
    if (provider === "anthropic" && !hasAnthropic()) continue;
    try {
      return provider === "openai" ? await tryOpenAI() : await tryAnthropic();
    } catch (err) {
      lastError = err;
      // try the next provider in the fallback order
    }
  }

  if (lastError) throw lastError;
  throw new Error(
    "No drafting provider configured. Set OPENAI_API_KEY (and optionally ANTHROPIC_API_KEY for fallback).",
  );
}
