import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Report which drafting providers have keys configured, so the UI can
 *  enable/disable model options without ever exposing the keys themselves. */
export async function GET() {
  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  });
}
