import { describe, it, expect } from "vitest";
import { providerForModel, modelById, MODELS, DEFAULT_MODEL_ID } from "../lib/models";

describe("models catalog", () => {
  it("has a resolvable default model", () => {
    expect(modelById(DEFAULT_MODEL_ID)).toBeDefined();
  });

  it("offers both OpenAI and Anthropic options", () => {
    expect(MODELS.some((m) => m.provider === "openai")).toBe(true);
    expect(MODELS.some((m) => m.provider === "anthropic")).toBe(true);
  });

  it("maps a model id to the right provider", () => {
    expect(providerForModel("gpt-4o")).toBe("openai");
    expect(providerForModel("claude-sonnet-4-6")).toBe("anthropic");
  });

  it("infers provider for unknown ids by prefix", () => {
    expect(providerForModel("claude-future-9")).toBe("anthropic");
    expect(providerForModel("some-other-model")).toBe("openai");
  });
});
