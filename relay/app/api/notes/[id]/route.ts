import { NextResponse } from "next/server";
import { getNote, updateNote, deleteNote } from "@/lib/db/notes.repo";
import { noteInputSchema, zodError } from "@/lib/validation";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ note });
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const patch = noteInputSchema.parse(await request.json());
    const note = await updateNote(id, patch);
    if (!note) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ note });
  } catch (err) {
    const issues = zodError(err);
    if (issues) return NextResponse.json({ error: "Invalid patch.", issues }, { status: 400 });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await deleteNote(id);
  return NextResponse.json({ ok: true });
}
