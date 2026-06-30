import { NextResponse } from "next/server";
import { generateDraft } from "@/lib/draftEngine";
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

    const draft = await generateDraft(req);
    return NextResponse.json(draft);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Drafting failed.";
    const status = /API_KEY|provider configured/.test(message) ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
