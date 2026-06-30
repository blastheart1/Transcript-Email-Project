import { describe, it, expect } from "vitest";
import { normalizeDraft } from "../lib/draftEngine";

describe("normalizeDraft", () => {
  it("fills sensible defaults for a sparse object", () => {
    const out = normalizeDraft({});
    expect(out.type).toBe("Note");
    expect(out.subject).toBe("Draft");
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
