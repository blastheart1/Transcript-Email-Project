import type AnthropicSDK from "@anthropic-ai/sdk";
import { getOpenAI, DRAFT_MODEL } from "./openai";
import { getAnthropic, hasAnthropic, ANTHROPIC_DRAFT_MODEL } from "./anthropic";
import { buildAuditSystemPrompt, buildAuditUserPrompt, VERDICT_SCHEMA } from "./prompts";
import { groundingFabrications } from "./factCheck";
import type { Verdict, Fabrication, DraftProvider } from "./types";

const AUDIT_OPENAI_MODEL = process.env.OPENAI_AUDIT_MODEL || "gpt-4o";
const AUDIT_ANTHROPIC_MODEL = process.env.ANTHROPIC_AUDIT_MODEL || "claude-sonnet-4-6";

interface AuditInput {
  transcript: string;
  draftText: string;
  styleSamples: string[];
  senderName: string;
  /** Provider that produced the draft — we audit with the OTHER one when possible. */
  draftProvider?: DraftProvider;
}

type RawVerdict = Omit<Verdict, "auditorProvider" | "auditorModel" | "repaired" | "attempts">;

async function auditOpenAI(system: string, user: string): Promise<RawVerdict> {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: AUDIT_OPENAI_MODEL,
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "relay_verdict", strict: true, schema: VERDICT_SCHEMA },
    },
  });
  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("Auditor returned nothing.");
  return JSON.parse(content) as RawVerdict;
}

async function auditAnthropic(system: string, user: string): Promise<RawVerdict> {
  const anthropic = getAnthropic();
  const msg = await anthropic.messages.create({
    model: AUDIT_ANTHROPIC_MODEL,
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: user }],
    tools: [
      {
        name: "relay_verdict",
        description: "Return the faithfulness audit in structured form.",
        input_schema: VERDICT_SCHEMA as unknown as AnthropicSDK.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "relay_verdict" },
  });
  const tool = msg.content.find((b) => b.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("Auditor returned nothing.");
  return tool.input as RawVerdict;
}

function mergeFabrications(a: Fabrication[], b: Fabrication[]): Fabrication[] {
  const out = [...a];
  const seen = new Set(a.map((f) => f.text.toLowerCase().trim()));
  for (const f of b) {
    const key = f.text.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(f);
    }
  }
  return out;
}

/**
 * Audit a draft for faithfulness to the transcript. Runs the deterministic
 * grounding check AND an independent cross-model LLM auditor, then merges them.
 */
export async function auditDraft(input: AuditInput): Promise<Verdict> {
  const haveOpenAI = !!process.env.OPENAI_API_KEY;
  const haveAnthropic = hasAnthropic();

  // Cross-model: audit with the provider that did NOT write the draft.
  let provider: DraftProvider;
  if (input.draftProvider === "openai" && haveAnthropic) provider = "anthropic";
  else if (input.draftProvider === "anthropic" && haveOpenAI) provider = "openai";
  else provider = haveAnthropic && input.draftProvider !== "anthropic" ? "anthropic" : haveOpenAI ? "openai" : "anthropic";

  const system = buildAuditSystemPrompt(input.senderName, input.styleSamples);
  const user = buildAuditUserPrompt(input.transcript, input.draftText);

  const deterministic = groundingFabrications(input.draftText, input.transcript);

  let raw: RawVerdict;
  let usedModel: string;
  try {
    if (provider === "anthropic") {
      raw = await auditAnthropic(system, user);
      usedModel = AUDIT_ANTHROPIC_MODEL;
    } else {
      raw = await auditOpenAI(system, user);
      usedModel = AUDIT_OPENAI_MODEL;
    }
  } catch (err) {
    // If the cross-model auditor is unavailable, fall back to deterministic-only.
    const faithful = !deterministic.some((f) => f.severity === "high");
    return {
      faithful,
      meaningPreserved: true,
      accuracy: deterministic.length === 0 ? 1 : faithful ? 0.9 : 0.6,
      fabrications: deterministic,
      omissions: [],
      unflaggedGuesses: [],
      styleScore: 1,
      styleNotes: `Auditor unavailable (${err instanceof Error ? err.message : "error"}); deterministic checks only.`,
      auditorProvider: undefined,
      auditorModel: undefined,
    };
  }

  const fabrications = mergeFabrications(raw.fabrications || [], deterministic);
  const faithful = raw.faithful && !fabrications.some((f) => f.severity === "high");
  // Deterministic findings cap the auditor's accuracy claim.
  let accuracy = typeof raw.accuracy === "number" ? raw.accuracy : 1;
  if (deterministic.some((f) => f.severity === "high")) accuracy = Math.min(accuracy, 0.6);
  else if (deterministic.length) accuracy = Math.min(accuracy, 0.9);

  return {
    faithful,
    meaningPreserved: raw.meaningPreserved,
    accuracy,
    fabrications,
    omissions: raw.omissions || [],
    unflaggedGuesses: raw.unflaggedGuesses || [],
    styleScore: typeof raw.styleScore === "number" ? raw.styleScore : 1,
    styleNotes: raw.styleNotes || "",
    auditorProvider: provider,
    auditorModel: usedModel,
  };
}
