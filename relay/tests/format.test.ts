import { describe, it, expect } from "vitest";
import { bodyText, buildMailto, textToParagraphs, flagCount, formatClock } from "../lib/format";
import type { Note } from "../lib/types";

const note: Pick<Note, "paragraphs" | "toEmail" | "subject" | "assumptions"> = {
  toEmail: "dana@example.co",
  subject: "Quick hello",
  paragraphs: [
    [{ t: "Hi Dana," }],
    [{ t: "Let’s meet " }, { t: "next Tuesday", flagged: true, tip: "confirm" }, { t: "." }],
    [{ t: "Thanks,\nConnor" }],
  ],
  assumptions: [{ t: "a", flagged: true }, { t: "b" }, { t: "c", flagged: true }],
};

describe("bodyText", () => {
  it("joins runs within a paragraph and paragraphs with blank lines", () => {
    expect(bodyText(note)).toBe("Hi Dana,\n\nLet’s meet next Tuesday.\n\nThanks,\nConnor");
  });
});

describe("buildMailto", () => {
  it("targets the recipient and encodes subject + body", () => {
    const url = buildMailto(note);
    expect(url.startsWith("mailto:dana@example.co?")).toBe(true);
    expect(url).toContain("subject=Quick+hello");
    expect(url).toContain("next+Tuesday");
  });
  it("leaves the recipient blank when none is set", () => {
    expect(buildMailto({ ...note, toEmail: "" }).startsWith("mailto:?")).toBe(true);
  });
});

describe("textToParagraphs", () => {
  it("splits on blank lines and drops empties", () => {
    const out = textToParagraphs("One\n\nTwo\n\n\nThree\n\n");
    expect(out).toEqual([[{ t: "One" }], [{ t: "Two" }], [{ t: "Three" }]]);
  });
});

describe("flagCount", () => {
  it("counts only flagged assumptions", () => {
    expect(flagCount(note)).toBe(2);
  });
});

describe("formatClock", () => {
  it("formats seconds as m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(-3)).toBe("0:00");
  });
});
