import { describe, it, expect } from "vitest";
import { groupSegments } from "../lib/transcribe";

describe("groupSegments", () => {
  it("returns an empty array for no input", () => {
    expect(groupSegments([])).toEqual([]);
  });

  it("merges fine-grained segments into ~13s timestamped chunks", () => {
    const raw = [
      { start: 0, text: "Hi there," },
      { start: 4, text: "thanks for the call." },
      { start: 14, text: "Following up now" }, // crosses the 13s boundary → closes chunk 0
      { start: 18, text: "with the resources." },
      { start: 30, text: "Talk soon." },
    ];
    const out = groupSegments(raw);
    expect(out).toHaveLength(2);
    expect(out[0].time).toBe("0:00");
    expect(out[0].text).toBe("Hi there, thanks for the call. Following up now");
    expect(out[1].time).toBe("0:18");
    expect(out[1].text).toBe("with the resources. Talk soon.");
  });

  it("formats bucket start times as m:ss", () => {
    const raw = [
      { start: 0, text: "a" },
      { start: 5, text: "b" }, // closes chunk starting at 0:00
      { start: 65, text: "c" },
      { start: 70, text: "d" }, // closes chunk starting at 1:05
    ];
    const out = groupSegments(raw, 3);
    expect(out[0].time).toBe("0:00");
    expect(out[1].time).toBe("1:05");
  });
});
