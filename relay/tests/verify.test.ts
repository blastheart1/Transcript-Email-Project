import { describe, it, expect } from "vitest";
import { coerceRaw } from "../lib/verify";

describe("coerceRaw (auditor output hardening)", () => {
  it("REGRESSION: non-array fabrications never crash (was 'a.map is not a function')", () => {
    const v = coerceRaw({ fabrications: "totally not an array" });
    expect(Array.isArray(v.fabrications)).toBe(true);
    expect(v.fabrications).toEqual([]);
  });

  it("handles null / undefined / non-object with safe defaults", () => {
    for (const bad of [null, undefined, 42, "x", []]) {
      const v = coerceRaw(bad);
      expect(Array.isArray(v.fabrications)).toBe(true);
      expect(Array.isArray(v.omissions)).toBe(true);
      expect(Array.isArray(v.unflaggedGuesses)).toBe(true);
      expect(v.accuracy).toBe(1);
      expect(v.faithful).toBe(true);
    }
  });

  it("normalizes fabrication items (defaults severity, coerces text/why, drops empty)", () => {
    const v = coerceRaw({
      fabrications: [
        { text: "invented@email.com", severity: "high", why: "not in note" },
        { text: "no severity given" },
        { text: "" }, // dropped
        "garbage", // dropped
        { why: "no text" }, // dropped (empty text)
      ],
    });
    expect(v.fabrications).toEqual([
      { text: "invented@email.com", severity: "high", why: "not in note" },
      { text: "no severity given", severity: "medium", why: "" },
    ]);
  });

  it("clamps accuracy/styleScore to 0..1 and defaults non-numbers", () => {
    expect(coerceRaw({ accuracy: 2 }).accuracy).toBe(1);
    expect(coerceRaw({ accuracy: -5 }).accuracy).toBe(0);
    expect(coerceRaw({ accuracy: "high" }).accuracy).toBe(1);
    expect(coerceRaw({ styleScore: 0.5 }).styleScore).toBe(0.5);
  });

  it("filters non-string entries from omissions/unflaggedGuesses", () => {
    const v = coerceRaw({ omissions: ["real", 3, null, "also real"], unflaggedGuesses: "nope" });
    expect(v.omissions).toEqual(["real", "also real"]);
    expect(v.unflaggedGuesses).toEqual([]);
  });

  it("respects explicit false booleans", () => {
    const v = coerceRaw({ faithful: false, meaningPreserved: false });
    expect(v.faithful).toBe(false);
    expect(v.meaningPreserved).toBe(false);
  });
});
