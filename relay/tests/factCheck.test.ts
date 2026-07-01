import { describe, it, expect } from "vitest";
import { groundingFabrications, hasHighSeverity } from "../lib/factCheck";

describe("groundingFabrications", () => {
  it("flags an email address that isn't in the transcript (high)", () => {
    const f = groundingFabrications("Email me at bob@acme.com.", "just email me later");
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe("high");
    expect(f[0].text).toBe("bob@acme.com");
  });

  it("does NOT flag an email that appears in the transcript", () => {
    const f = groundingFabrications("Email bob@acme.com please.", "his address is bob@acme.com");
    expect(f).toHaveLength(0);
  });

  it("flags an invented link and phone number", () => {
    const f = groundingFabrications(
      "See https://relay.app/guide or call 415-555-1212.",
      "I'll send some resources and my number later",
    );
    expect(f.length).toBe(2);
    expect(hasHighSeverity(f)).toBe(true);
  });

  it("grounds a link when its host is mentioned", () => {
    const f = groundingFabrications("Watch it at https://youtube.com/xyz", "there's a youtube.com video");
    expect(f).toHaveLength(0);
  });

  it("treats a dollar amount as medium severity", () => {
    const f = groundingFabrications("It's $500.", "it costs about five hundred");
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe("medium");
    expect(hasHighSeverity(f)).toBe(false);
  });
});
