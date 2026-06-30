import { NextResponse } from "next/server";
import { listStyleSamples, createStyleSample, deleteStyleSample } from "@/lib/db/style-samples.repo";
import { styleSampleInputSchema, zodError } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ styleSamples: await listStyleSamples() });
  } catch (err) {
    return NextResponse.json({ error: errMsg(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = styleSampleInputSchema.parse(await request.json());
    const sample = await createStyleSample(input);
    return NextResponse.json({ styleSample: sample }, { status: 201 });
  } catch (err) {
    const issues = zodError(err);
    if (issues) return NextResponse.json({ error: "Invalid sample.", issues }, { status: 400 });
    return NextResponse.json({ error: errMsg(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
    await deleteStyleSample(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: errMsg(err) }, { status: 500 });
  }
}

function errMsg(err: unknown) {
  return err instanceof Error ? err.message : "Request failed.";
}
