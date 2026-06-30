import { NextResponse } from "next/server";
import { getSettings, updateSettings, toPublicSettings } from "@/lib/db/settings.repo";
import { settingsPatchSchema, zodError } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const row = await getSettings();
    return NextResponse.json({ settings: toPublicSettings(row) });
  } catch (err) {
    return NextResponse.json({ error: errMsg(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const patch = settingsPatchSchema.parse(await request.json());
    // Empty string clears the webhook secret.
    if (patch.webhookSecret === "") patch.webhookSecret = null;
    const row = await updateSettings(patch);
    return NextResponse.json({ settings: toPublicSettings(row) });
  } catch (err) {
    const issues = zodError(err);
    if (issues) return NextResponse.json({ error: "Invalid settings.", issues }, { status: 400 });
    return NextResponse.json({ error: errMsg(err) }, { status: 500 });
  }
}

function errMsg(err: unknown) {
  return err instanceof Error ? err.message : "Request failed.";
}
