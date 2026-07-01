import { describe, it, expect } from "vitest";
import { normalizeDraft, ensureSubject, cleanParagraphs } from "../lib/draftEngine";

describe("cleanParagraphs", () => {
  it("drops blank paragraphs and empty runs (no stray blank lines)", () => {
    const out = cleanParagraphs([
      [{ t: "Hi Dana," }],
      [{ t: "" }], // blank paragraph → dropped
      [{ t: "Body " }, { t: "" }, { t: "text." }], // empty middle run → dropped
      [{ t: "   " }], // whitespace-only paragraph → dropped
      [{ t: "Thanks,\nConnor" }],
    ]);
    expect(out).toEqual([
      [{ t: "Hi Dana," }],
      [{ t: "Body " }, { t: "text." }],
      [{ t: "Thanks,\nConnor" }],
    ]);
  });

  it("preserves flagged runs and their tips", () => {
    const out = cleanParagraphs([[{ t: "See " }, { t: "next Tue", flagged: true, tip: "confirm" }]]);
    expect(out[0][1]).toEqual({ t: "next Tue", flagged: true, tip: "confirm" });
  });
});

describe("ensureSubject", () => {
  it("keeps a good subject", () => {
    expect(ensureSubject({ subject: "Onboarding frameworks for your team" })).toBe(
      "Onboarding frameworks for your team",
    );
  });
  it("replaces blank or weak subjects", () => {
    expect(ensureSubject({ subject: "", type: "Reply" })).toBe("Re: your note");
    expect(ensureSubject({ subject: "Draft", type: "Follow-up", person: "Marcus" })).toBe(
      "Follow-up for Marcus",
    );
    expect(ensureSubject({ subject: "Email", type: "Intro", person: "Andre" })).toBe("Intro: Andre");
  });
});

describe("normalizeDraft", () => {
  it("fills sensible defaults for a sparse object", () => {
    const out = normalizeDraft({});
    expect(out.type).toBe("Note");
    expect(out.subject).toBe("Quick note");
    expect(out.person).toBe("");
    expect(out.toEmail).toBe("");
    expect(out.paragraphs).toEqual([]);
    expect(out.assumptions).toEqual([]);
  });

  it("keeps flagged runs (with a default tip) and strips noise from plain runs", () => {
    const out = normalizeDraft({
      paragraphs: [[{ t: "plain", flagged: false, tip: "" }, { t: "guess", flagged: true, tip: "" }]],
    });
    expect(out.paragraphs[0][0]).toEqual({ t: "plain" });
    expect(out.paragraphs[0][1]).toEqual({ t: "guess", flagged: true, tip: "Inferred — please confirm." });
  });

  it("preserves an explicit tip on flagged assumptions", () => {
    const out = normalizeDraft({
      assumptions: [
        { t: "check date", flagged: true, tip: "verify Tuesday" },
        { t: "cleaned filler", flagged: false, tip: "" },
      ],
    });
    expect(out.assumptions[0]).toEqual({ t: "check date", flagged: true, tip: "verify Tuesday" });
    expect(out.assumptions[1]).toEqual({ t: "cleaned filler" });
  });
});
