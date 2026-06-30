import type { Note, BodySegment } from "./types";

/** Flatten the structured paragraphs into plain email body text. */
export function bodyText(note: Pick<Note, "paragraphs">): string {
  return note.paragraphs.map((p) => p.map((s) => s.t).join("")).join("\n\n");
}

/** Build a mailto: URL for the "Open in email" action. */
export function buildMailto(note: Pick<Note, "toEmail" | "subject" | "paragraphs">): string {
  const params = new URLSearchParams({
    subject: note.subject,
    body: bodyText(note),
  });
  return `mailto:${note.toEmail || ""}?${params.toString()}`;
}

/** Parse edited plain text back into paragraphs of unflagged runs. */
export function textToParagraphs(text: string): BodySegment[][] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => [{ t: p }]);
}

export function flagCount(note: Pick<Note, "assumptions">): number {
  return (note.assumptions || []).filter((a) => a.flagged).length;
}

/** Seconds (float) → "m:ss". Pure helper safe for client + server. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}
