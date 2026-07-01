import { NextResponse } from "next/server";
import { runDraftPipeline } from "@/lib/pipeline";
import type { DraftRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function isTone(v: unknown): v is DraftRequest["tone"] {
  return v === "Warm" || v === "Neutral" || v === "Direct";
}
function isLength(v: unknown): v is DraftRequest["length"] {
  return v === "Concise" || v === "Standard" || v === "Detailed";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<DraftRequest>;
    const transcript = (body.transcript || "").trim();
    if (!transcript) {
      return NextResponse.json({ error: "Transcript is empty." }, { status: 400 });
    }

    const req: DraftRequest = {
      transcript,
      segments: body.segments,
      tone: isTone(body.tone) ? body.tone : "Warm",
      length: isLength(body.length) ? body.length : "Standard",
      styleSamples: Array.isArray(body.styleSamples) ? body.styleSamples : [],
      signOff: body.signOff || "Thanks,\nConnor",
      senderName: body.senderName || "Connor",
      model: typeof body.model === "string" ? body.model : undefined,
    };

    const result = await runDraftPipeline(req);
    // Flatten so existing clients keep working, plus verdict + status.
    return NextResponse.json({
      ...result.draft,
      provider: result.provider,
      model: result.model,
      verdict: result.verdict,
      status: result.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Drafting failed.";
    const status = /API_KEY|provider configured/.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
