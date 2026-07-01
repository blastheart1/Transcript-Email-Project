import { describe, it, expect } from "vitest";
import { flagGuessesInParagraphs, needsReprocess } from "../lib/pipeline";
import type { Verdict } from "../lib/types";

const baseVerdict: Verdict = {
  faithful: true,
  meaningPreserved: true,
  accuracy: 1,
  fabrications: [],
  omissions: [],
  unflaggedGuesses: [],
  styleScore: 1,
  styleNotes: "",
};

describe("needsReprocess", () => {
  it("passes a clean, fully-accurate draft", () => {
    expect(needsReprocess(baseVerdict)).toBe(false);
  });
  it("reprocesses on ANY fabrication, even low severity", () => {
    expect(
      needsReprocess({ ...baseVerdict, fabrications: [{ text: "x", severity: "low", why: "y" }] }),
    ).toBe(true);
  });
  it("reprocesses when accuracy drops below 95%", () => {
    expect(needsReprocess({ ...baseVerdict, accuracy: 0.94 })).toBe(true);
    expect(needsReprocess({ ...baseVerdict, accuracy: 0.95 })).toBe(false);
  });
});

describe("flagGuessesInParagraphs", () => {
  it("splits a matched span into a flagged run", () => {
    const out = flagGuessesInParagraphs([[{ t: "Let's meet next Tuesday at noon." }]], ["next Tuesday"]);
    expect(out[0]).toEqual([
      { t: "Let's meet " },
      { t: "next Tuesday", flagged: true, tip: "Inferred — confirm this detail before sending." },
      { t: " at noon." },
    ]);
  });

  it("leaves paragraphs without a match unchanged", () => {
    const input = [[{ t: "Thanks so much!" }]];
    expect(flagGuessesInParagraphs(input, ["next Tuesday"])).toEqual(input);
  });

  it("does not re-flag an already-flagged run", () => {
    const input = [[{ t: "next Tuesday", flagged: true, tip: "x" }]];
    expect(flagGuessesInParagraphs(input, ["next Tuesday"])).toEqual(input);
  });

  it("ignores very short guess terms", () => {
    const input = [[{ t: "It is ok" }]];
    expect(flagGuessesInParagraphs(input, ["ok"])).toEqual(input);
  });
});
