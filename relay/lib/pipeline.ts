import { generateDraft, type DraftResult } from "./draftEngine";
import { auditDraft } from "./verify";
import { bodyText } from "./format";
import type { DraftRequest, DraftResponse, BodySegment, Verdict, NoteStatus } from "./types";

/** Total draft attempts allowed (1 initial + up to 2 stricter re-drafts). */
const MAX_ATTEMPTS = 3;

export interface PipelineResult {
  draft: DraftResponse;
  verdict: Verdict;
  status: Extract<NoteStatus, "ready" | "needs_review">;
  provider: string;
  model: string;
}

/** Reprocess only to clear fabrications — we don't chase an accuracy target. */
export function needsReprocess(v: Verdict): boolean {
  return v.fabrications.length > 0;
}

/** Best-effort: split any unflagged inferred span into a highlighted run. */
export function flagGuessesInParagraphs(
  paragraphs: BodySegment[][],
  guesses: string[],
): BodySegment[][] {
  const terms = guesses.map((g) => g.trim()).filter((g) => g.length >= 3);
  if (!terms.length) return paragraphs;
  return paragraphs.map((para) => {
    let segs = para;
    for (const term of terms) {
      segs = segs.flatMap((seg) => {
        if (seg.flagged) return [seg];
        const idx = seg.t.toLowerCase().indexOf(term.toLowerCase());
        if (idx === -1) return [seg];
        const before = seg.t.slice(0, idx);
        const match = seg.t.slice(idx, idx + term.length);
        const after = seg.t.slice(idx + term.length);
        const out: BodySegment[] = [];
        if (before) out.push({ t: before });
        out.push({ t: match, flagged: true, tip: "Inferred — confirm this detail before sending." });
        if (after) out.push({ t: after });
        return out;
      });
    }
    return segs;
  });
}

function applyVerdict(draft: DraftResponse, verdict: Verdict): DraftResponse {
  return { ...draft, paragraphs: flagGuessesInParagraphs(draft.paragraphs, verdict.unflaggedGuesses) };
}

async function audit(req: DraftRequest, draft: DraftResult): Promise<Verdict> {
  return auditDraft({
    transcript: req.transcript,
    draftText: bodyText(draft),
    styleSamples: req.styleSamples,
    senderName: req.senderName,
    draftProvider: draft.provider,
  });
}

/**
 * Draft → cross-model audit → reprocess loop → apply flags → status. Shared by
 * /api/draft and /api/ingest so every trigger gets identical guardrails E2E.
 *
 * Policy: if the audit finds any fabrication, run a stricter re-draft that
 * targets the exact findings and re-audit — up to MAX_ATTEMPTS. If fabrications
 * remain after that, hold as "needs_review" with an honest disclaimer about
 * whether the source voice note is the likely limiter. Inferred spans are always
 * flagged, whatever the outcome.
 */
export async function runDraftPipeline(req: DraftRequest): Promise<PipelineResult> {
  let draft = await generateDraft(req);
  let verdict = await audit(req, draft);
  const firstFabCount = verdict.fabrications.length;
  let attempts = 1;

  while (needsReprocess(verdict) && attempts < MAX_ATTEMPTS) {
    draft = await generateDraft({
      ...req,
      repair: {
        fabrications: verdict.fabrications.map((f) => f.text),
        omissions: verdict.omissions,
        unflaggedGuesses: verdict.unflaggedGuesses,
      },
    });
    verdict = await audit(req, draft);
    attempts += 1;
  }

  verdict = { ...verdict, attempts, repaired: attempts > 1 };

  // Couldn't clear every fabrication → be honest about the likely cause.
  if (needsReprocess(verdict)) {
    const improved = verdict.fabrications.length < firstFabCount;
    verdict.reviewNote = improved
      ? `Reprocessed ${attempts}× and reduced the issues, but a couple of details still couldn't be verified against your note. They're highlighted — confirm or remove them before sending.`
      : `Reprocessed ${attempts}× and couldn't clear these. That usually points to the source voice note itself — unclear, noisy, or missing details. AI can only work from what was actually said, so check the transcript and consider re-recording.`;
  }

  const status = needsReprocess(verdict) ? "needs_review" : "ready";
  return { draft: applyVerdict(draft, verdict), verdict, status, provider: draft.provider, model: draft.model };
}
