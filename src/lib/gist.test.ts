import { describe, expect, it } from "vitest";
import { fallbackGist } from "./gist";
import { mockCapture, mockGist, mockSignAt } from "./mock-signs";

describe("fallbackGist", () => {
  it("joins candidate labels and stays uncertain", () => {
    const result = fallbackGist({
      context: "pharmacy",
      frames: 42,
      durationMs: 3000,
      candidates: [
        { label: "need", confidence: 0.8 },
        { label: "prescription", confidence: 0.7 },
      ],
    });

    expect(result.uncertain).toBe(true);
    expect(result.confidence).toBeLessThan(0.6);
    expect(result.gist).toContain("need");
    expect(result.gist).toContain("prescription");
  });

  it("asks the person to try again when nothing was captured", () => {
    const result = fallbackGist({
      context: "general",
      frames: 0,
      durationMs: 0,
      candidates: [],
    });

    expect(result.uncertain).toBe(true);
    expect(result.alternatives).toEqual([]);
    expect(result.gist.toLowerCase()).toContain("try again");
  });

  it("never invents a sentence with more than the captured labels", () => {
    const result = fallbackGist({
      context: "transit",
      frames: 10,
      durationMs: 1000,
      candidates: [{ label: "platform", confidence: 0.4 }],
    });

    expect(result.gist).toBe("I need help with this: platform.");
  });
});

describe("mock sign data", () => {
  it("cycles deterministically within a context", () => {
    const list = mockSignAt("pharmacy", 0);
    expect(mockSignAt("pharmacy", 4)).toEqual(list);
  });

  it("builds a capture with the right context and frame count", () => {
    const capture = mockCapture("restaurant", 0, 3000);
    expect(capture.context).toBe("restaurant");
    expect(capture.durationMs).toBe(3000);
    expect(capture.frames).toBeGreaterThan(0);
    expect(capture.candidates.length).toBeGreaterThan(0);
  });

  it("marks low-confidence demo signs as uncertain", () => {
    const result = mockGist("transit", 2);
    expect(result.uncertain).toBe(true);
    expect(result.alternatives.length).toBeGreaterThan(0);
  });
});
