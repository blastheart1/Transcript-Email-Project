import { NextResponse } from "next/server";
import { listNotes, createNote } from "@/lib/db/notes.repo";
import { noteInputSchema, zodError } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ notes: await listNotes() });
  } catch (err) {
    return NextResponse.json({ error: errMsg(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = noteInputSchema.parse(await request.json());
    const note = await createNote(parsed);
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    const issues = zodError(err);
    if (issues) return NextResponse.json({ error: "Invalid note payload.", issues }, { status: 400 });
    return NextResponse.json({ error: errMsg(err) }, { status: 500 });
  }
}

function errMsg(err: unknown) {
  return err instanceof Error ? err.message : "Request failed.";
}
