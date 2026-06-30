import { desc, eq } from "drizzle-orm";
import { db } from "./client";
import { notes, type NoteRow, type NoteInsert } from "./schema";
import type { Note, NoteStatus, NoteType, Tone, Length } from "../types";

/** Map a DB row to the domain `Note` used across the app. */
export function rowToNote(r: NoteRow): Note {
  return {
    id: r.id,
    person: r.person,
    type: r.type,
    subject: r.subject,
    status: r.status,
    received: r.receivedLabel,
    duration: r.duration,
    transcript: r.transcript,
    toEmail: r.toEmail,
    cc: r.cc || "",
    bcc: r.bcc || "",
    audioURL: r.audioUrl ?? null,
    segments: r.segments ?? [],
    paragraphs: r.paragraphs ?? [],
    assumptions: r.assumptions ?? [],
    tone: (r.tone as Tone) ?? undefined,
    length: (r.length as Length) ?? undefined,
    model: r.model ?? undefined,
    provider: r.provider ?? undefined,
    errorMessage: r.errorMessage ?? undefined,
  };
}

/** Map a domain note (partial) to an insert/update payload. */
export function noteToColumns(n: Partial<Note> & { source?: string }): Partial<NoteInsert> {
  const cols: Partial<NoteInsert> = {};
  if (n.id !== undefined) cols.id = n.id;
  if (n.person !== undefined) cols.person = n.person;
  if (n.type !== undefined) cols.type = n.type as NoteType;
  if (n.subject !== undefined) cols.subject = n.subject;
  if (n.status !== undefined) cols.status = n.status as NoteStatus;
  if (n.received !== undefined) cols.receivedLabel = n.received;
  if (n.duration !== undefined) cols.duration = n.duration;
  if (n.transcript !== undefined) cols.transcript = n.transcript;
  if (n.toEmail !== undefined) cols.toEmail = n.toEmail;
  if (n.cc !== undefined) cols.cc = n.cc;
  if (n.bcc !== undefined) cols.bcc = n.bcc;
  if (n.audioURL !== undefined) cols.audioUrl = n.audioURL ?? null;
  if (n.segments !== undefined) cols.segments = n.segments;
  if (n.paragraphs !== undefined) cols.paragraphs = n.paragraphs;
  if (n.assumptions !== undefined) cols.assumptions = n.assumptions;
  if (n.tone !== undefined) cols.tone = n.tone;
  if (n.length !== undefined) cols.length = n.length;
  if (n.model !== undefined) cols.model = n.model;
  if (n.provider !== undefined) cols.provider = n.provider;
  if (n.errorMessage !== undefined) cols.errorMessage = n.errorMessage;
  if (n.source !== undefined) cols.source = n.source;
  return cols;
}

export async function listNotes(): Promise<Note[]> {
  const rows = await db.select().from(notes).orderBy(desc(notes.createdAt));
  return rows.map(rowToNote);
}

export async function getNote(id: string): Promise<Note | null> {
  const rows = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return rows[0] ? rowToNote(rows[0]) : null;
}

export async function createNote(input: Partial<Note> & { source?: string }): Promise<Note> {
  const [row] = await db.insert(notes).values(noteToColumns(input)).returning();
  return rowToNote(row);
}

export async function updateNote(id: string, patch: Partial<Note>): Promise<Note | null> {
  const cols = noteToColumns(patch);
  cols.updatedAt = new Date();
  const [row] = await db.update(notes).set(cols).where(eq(notes.id, id)).returning();
  return row ? rowToNote(row) : null;
}

export async function deleteNote(id: string): Promise<void> {
  await db.delete(notes).where(eq(notes.id, id));
}

/** Idempotent upsert by id — used by the seed script. */
export async function upsertNote(input: Partial<Note> & { id: string; source?: string }): Promise<void> {
  const cols = noteToColumns(input);
  await db
    .insert(notes)
    .values(cols as NoteInsert)
    .onConflictDoUpdate({ target: notes.id, set: { ...cols, updatedAt: new Date() } });
}
