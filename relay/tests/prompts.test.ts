import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserPrompt, DRAFT_SCHEMA } from "../lib/prompts";
import type { DraftRequest } from "../lib/types";

const req: DraftRequest = {
  transcript: "intro email to Dana about the chief of staff role",
  segments: [{ time: "0:00", text: "intro email to Dana" }],
  tone: "Warm",
  length: "Concise",
  styleSamples: ["UNIQUE_STYLE_SAMPLE_MARKER"],
  signOff: "Thanks,\nConnor",
  senderName: "Connor",
};

describe("buildSystemPrompt", () => {
  const sys = buildSystemPrompt(req);
  it("embeds the core guardrails", () => {
    expect(sys).toContain("Never invent facts");
    expect(sys).toContain("Flag every guess");
    expect(sys).toContain("Never auto-send");
  });
  it("includes the provided style sample and sign-off", () => {
    expect(sys).toContain("UNIQUE_STYLE_SAMPLE_MARKER");
    expect(sys).toContain("Thanks,\nConnor");
  });
  it("reflects the selected tone and length", () => {
    expect(sys).toContain("TONE: Warm");
    expect(sys).toContain("LENGTH: Concise");
  });
  it("instructs leaving the recipient blank when not dictated", () => {
    expect(sys.toLowerCase()).toContain("toemail");
  });
});

describe("buildUserPrompt", () => {
  it("uses timestamped segments when present", () => {
    expect(buildUserPrompt(req)).toContain("[0:00] intro email to Dana");
  });
  it("falls back to the raw transcript without segments", () => {
    expect(buildUserPrompt({ ...req, segments: [] })).toContain("intro email to Dana about the chief");
  });
});

describe("DRAFT_SCHEMA", () => {
  it("requires the structured draft fields", () => {
    expect(DRAFT_SCHEMA.required).toEqual(
      expect.arrayContaining(["type", "person", "toEmail", "subject", "paragraphs", "assumptions"]),
    );
  });
});
