import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Report which drafting providers + sign-in methods are configured, so the UI
 *  can enable/disable options without ever exposing the keys themselves. */
export async function GET() {
  return NextResponse.json({
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  });
}
