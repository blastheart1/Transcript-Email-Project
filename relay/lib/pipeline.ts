import { generateDraft, type DraftResult } from "./draftEngine";
import { auditDraft } from "./verify";
import { bodyText } from "./format";
import type { DraftRequest, DraftResponse, BodySegment, Verdict, NoteStatus } from "./types";

/** Reprocess trigger: any fabrication (any severity) OR accuracy below this. */
export const ACCURACY_THRESHOLD = 0.95;
/** Total draft attempts allowed (1 initial + up to 2 stricter re-drafts). */
const MAX_ATTEMPTS = 3;

export interface PipelineResult {
  draft: DraftResponse;
  verdict: Verdict;
  status: Extract<NoteStatus, "ready" | "needs_review">;
  provider: string;
  model: string;
}

/** True when the draft must be reprocessed: any fabrication, or accuracy < 95%. */
export function needsReprocess(v: Verdict, threshold = ACCURACY_THRESHOLD): boolean {
  return v.fabrications.length > 0 || (v.accuracy ?? 1) < threshold;
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
 * Policy: while the audit reports ANY fabrication or accuracy < 95%, run a
 * stricter re-draft that targets the exact findings and re-audit — up to
 * MAX_ATTEMPTS. If it still fails after that, hold the note as "needs_review".
 */
export async function runDraftPipeline(req: DraftRequest): Promise<PipelineResult> {
  let draft = await generateDraft(req);
  let verdict = await audit(req, draft);
  const firstAccuracy = verdict.accuracy ?? 1;
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

  // Exhausted the retries and still not clean → tell the reviewer why. If accuracy
  // never improved across passes, the limiter is almost always the source audio.
  if (needsReprocess(verdict)) {
    const improved = (verdict.accuracy ?? 1) > firstAccuracy + 0.02;
    verdict.reviewNote = improved
      ? `Still below the ${Math.round(ACCURACY_THRESHOLD * 100)}% accuracy bar after ${attempts} passes — review the highlighted items before sending.`
      : `Relay reprocessed this ${attempts}× and accuracy didn't improve. That usually means the source voice note is unclear, noisy, or missing key details — AI can only work from what was actually said. Check the transcript on the left and consider re-recording the note.`;
  }

  const status = needsReprocess(verdict) ? "needs_review" : "ready";
  return { draft: applyVerdict(draft, verdict), verdict, status, provider: draft.provider, model: draft.model };
}
