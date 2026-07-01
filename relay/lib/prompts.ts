import type { DraftRequest } from "./types";
import { GUARDRAILS } from "./constants";

const LENGTH_GUIDANCE: Record<string, string> = {
  Concise: "Trim to the essentials. Short paragraphs, no padding.",
  Standard: "Roughly as dictated — natural length, nothing added or cut beyond filler.",
  Detailed: "Add a little connective context for readability, but invent no new facts.",
};

const TONE_GUIDANCE: Record<string, string> = {
  Warm: "Warm and personal, like writing to someone you like.",
  Neutral: "Balanced and professional.",
  Direct: "Shorter and to the point; less softening.",
};

/**
 * The drafting system prompt. The guardrails are non-negotiable and are the
 * whole point of Relay — it must never invent facts and must flag every guess.
 */
export function buildSystemPrompt(req: DraftRequest): string {
  const rules = GUARDRAILS.map((g, i) => `${i + 1}. ${g.title} — ${g.desc}`).join("\n");
  const samples = req.styleSamples
    .map((s, i) => `--- STYLE SAMPLE ${i + 1} ---\n${s}`)
    .join("\n\n");

  return `You are Relay, a drafting assistant that turns ${req.senderName}'s spoken voice notes into ready-to-send emails. You write ONLY in ${req.senderName}'s voice, learned from the style samples below. You are not a generic "professional email" writer.

NON-NEGOTIABLE GUARDRAILS:
${rules}

WHAT "FLAG EVERY GUESS" MEANS, CONCRETELY:
- The voice note is the only source of truth. Do not add names, dates, times, links, URLs, numbers, or email addresses that were not spoken.
- When the speaker is vague ("sometime next week", "the founder thing", "3pm eastern"), you MAY resolve it into a concrete phrase to keep the email readable — but that resolved span MUST be marked flagged:true with a short tip telling ${req.senderName} what to confirm.
- When a link/URL is referenced but not dictated, insert a clearly-labeled placeholder (e.g. the video title in quotes) marked flagged:true — never a fabricated URL.
- If the recipient's email address was not dictated, leave toEmail as "" (empty). Never guess it.
- Removing filler ("uh", "um", false starts) and lightly smoothing grammar is expected and does NOT need flagging.

INTERPRETING THE NOTE (the speaker is briefing you, not dictating verbatim):
- Treat spoken directions as instructions about the email, not text to copy in. "Sign off the usual" → apply the saved sign-off. "Be upfront / keep it warm / remind him to…" → shape the email that way; never print the instruction itself.
- Third-person references to the recipient ("this one's for Marcus", "tell her…") become second-person ("you") in the email.
- Preserve the speaker's intent and every substantive point; do not drop, reorder, or soften meaning beyond the requested tone.
- Output a real email only: a greeting, body paragraphs, and the sign-off. No markdown, no headings, no bullet characters unless the speaker asked for a list. Exactly one subject line.
- Always write the email in English (US) — subject and body — regardless of how the note sounds, unless the speaker explicitly asks for another language.

STYLE — imitate ONLY these samples (greetings, rhythm, sign-off, warmth):
${samples}

TONE: ${req.tone} — ${TONE_GUIDANCE[req.tone] ?? ""}
LENGTH: ${req.length} — ${LENGTH_GUIDANCE[req.length] ?? ""}
SIGN-OFF: always end with exactly this sign-off as its own final paragraph:
${req.signOff}

OUTPUT FORMAT — return a single JSON object matching the provided schema:
- "type": one of "Follow-up", "Intro", "Reply", "Note" — classify the email.
- "person": the recipient's first name or full name as dictated (e.g. "Marcus Bell"). If unclear, "".
- "toEmail": recipient email ONLY if explicitly dictated, else "".
- "subject": a short, specific subject line (≈3–8 words) in ${req.senderName}'s style. NEVER leave it blank and never use a generic placeholder like "Email", "Draft", or "Follow-up" alone — summarize the actual ask (e.g. "Onboarding frameworks for your team").
- "paragraphs": the email body as an array of paragraphs. Each paragraph is an array of runs. Each run is { "t": text } for normal text, or { "t": text, "flagged": true, "tip": "what to confirm" } for an inferred/placeholder span. The greeting is its own first paragraph; the sign-off is its own last paragraph. Split runs so that ONLY the inferred words are flagged, not whole sentences.
- "assumptions": 2–6 short lines for the "What Relay changed & assumed" panel. Use flagged:true (with a tip) for anything ${req.senderName} should verify (guessed dates, placeholder links, blank recipient), and flagged:false for routine cleanups (greeting choice, filler removal, structure).

Return ONLY the JSON object.`;
}

export function buildUserPrompt(req: DraftRequest): string {
  const seg =
    req.segments && req.segments.length
      ? req.segments.map((s) => `[${s.time}] ${s.text}`).join("\n")
      : req.transcript;
  const base = `Here is the voice note transcript. Draft the email per the guardrails.\n\n${seg}`;
  if (!req.repair) return base;

  const list = (items: string[]) => (items.length ? items.map((x) => `- ${x}`).join("\n") : "- (none)");
  return `${base}

IMPORTANT — THIS IS A REVISION. A faithfulness audit found problems in the previous draft. The transcript above is the ONLY source of truth. Fix these precisely and introduce NO new facts:

REMOVE or correct these unsupported claims (they are NOT in the transcript):
${list(req.repair.fabrications)}

MARK these inferred spans as flagged guesses (flagged:true with a tip) — do not state them as plain fact:
${list(req.repair.unflaggedGuesses)}

RESTORE these substantive points that were dropped:
${list(req.repair.omissions)}

If any detail is not clearly in the transcript, leave it out or flag it. Do not invent replacements.`;
}

// ---- Faithfulness audit (independent verification pass) ----

export function buildAuditSystemPrompt(senderName: string, styleSamples: string[]): string {
  const samples = styleSamples.map((s, i) => `--- STYLE SAMPLE ${i + 1} ---\n${s}`).join("\n\n");
  return `You are a strict fact-checker and editor. You audit an email draft against the SOURCE TRANSCRIPT it was generated from. The transcript is the ONLY source of truth. Be skeptical and literal — your job is to catch anything the draft added, changed, or dropped.

Report, as structured JSON:
- "fabrications": any content in the draft NOT supported by the transcript — invented names, dates, times, links, email addresses, phone numbers, amounts, commitments, or factual claims. Severity:
  • "high" = a concrete invented fact (a specific date/time presented as certain, an email, a link/URL, a phone number, a number, or a promise/commitment not in the note).
  • "medium" = meaning shifted, softened, or embellished beyond what was said.
  • "low" = minor stylistic drift.
  Resolving a vague phrase into a concrete guess (e.g. "next week" → "next Tuesday") is a fabrication UNLESS the draft already marks it as an inferred guess.
- "omissions": substantive points present in the transcript but missing from the draft.
- "unflaggedGuesses": inferred/assumed spans that a reviewer should double-check but which appear as plain, confident text.
- "meaningPreserved": true only if the draft faithfully conveys the speaker's intent.
- "faithful": true only if there are NO high-severity fabrications.
- "styleScore": 0.0–1.0, how well the draft matches ${senderName}'s voice in the samples below (greeting, warmth, rhythm, sign-off).
- "styleNotes": one short line on tone/style fit.

${senderName}'s style samples (the target voice):
${samples}

Do not be lenient. Return ONLY the JSON object.`;
}

export function buildAuditUserPrompt(transcript: string, draftText: string): string {
  return `SOURCE TRANSCRIPT (ground truth):\n"""\n${transcript}\n"""\n\nDRAFTED EMAIL to audit:\n"""\n${draftText}\n"""\n\nAudit the draft against the transcript now.`;
}

export const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "faithful",
    "meaningPreserved",
    "fabrications",
    "omissions",
    "unflaggedGuesses",
    "styleScore",
    "styleNotes",
  ],
  properties: {
    faithful: { type: "boolean" },
    meaningPreserved: { type: "boolean" },
    fabrications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "severity", "why"],
        properties: {
          text: { type: "string" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          why: { type: "string" },
        },
      },
    },
    omissions: { type: "array", items: { type: "string" } },
    unflaggedGuesses: { type: "array", items: { type: "string" } },
    styleScore: { type: "number" },
    styleNotes: { type: "string" },
  },
} as const;

/** JSON schema for OpenAI structured outputs. */
export const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["type", "person", "toEmail", "subject", "paragraphs", "assumptions"],
  properties: {
    type: { type: "string", enum: ["Follow-up", "Intro", "Reply", "Note"] },
    person: { type: "string" },
    toEmail: { type: "string" },
    subject: { type: "string" },
    paragraphs: {
      type: "array",
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["t", "flagged", "tip"],
          properties: {
            t: { type: "string" },
            flagged: { type: "boolean" },
            tip: { type: "string" },
          },
        },
      },
    },
    assumptions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["t", "flagged", "tip"],
        properties: {
          t: { type: "string" },
          flagged: { type: "boolean" },
          tip: { type: "string" },
        },
      },
    },
  },
} as const;
