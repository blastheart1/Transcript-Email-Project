import { generateDraft } from "./draftEngine";
import { auditDraft } from "./verify";
import { hasHighSeverity } from "./factCheck";
import { bodyText } from "./format";
import type { DraftRequest, DraftResponse, BodySegment, Verdict, NoteStatus } from "./types";

export interface PipelineResult {
  draft: DraftResponse;
  verdict: Verdict;
  status: Extract<NoteStatus, "ready" | "needs_review">;
  provider: string;
  model: string;
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

/**
 * Draft → cross-model audit → (if high-severity: stricter repair pass → re-audit)
 * → apply flags → status. Shared by /api/draft and /api/ingest so every trigger
 * gets identical guardrails end to end.
 */
export async function runDraftPipeline(req: DraftRequest): Promise<PipelineResult> {
  const first = await generateDraft(req);
  let verdict = await auditDraft({
    transcript: req.transcript,
    draftText: bodyText(first),
    styleSamples: req.styleSamples,
    senderName: req.senderName,
    draftProvider: first.provider,
  });

  let draft: DraftResponse = first;
  let provider = first.provider;
  let model = first.model;

  // Repair loop: one stricter re-draft targeting the audit's findings.
  if (hasHighSeverity(verdict.fabrications)) {
    const repaired = await generateDraft({
      ...req,
      repair: {
        fabrications: verdict.fabrications.map((f) => f.text),
        omissions: verdict.omissions,
        unflaggedGuesses: verdict.unflaggedGuesses,
      },
    });
    const reVerdict = await auditDraft({
      transcript: req.transcript,
      draftText: bodyText(repaired),
      styleSamples: req.styleSamples,
      senderName: req.senderName,
      draftProvider: repaired.provider,
    });
    draft = repaired;
    provider = repaired.provider;
    model = repaired.model;
    verdict = { ...reVerdict, repaired: true };
  }

  const status = hasHighSeverity(verdict.fabrications) ? "needs_review" : "ready";
  return { draft: applyVerdict(draft, verdict), verdict, status, provider, model };
}
