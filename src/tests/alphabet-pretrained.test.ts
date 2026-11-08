import { describe, expect, it } from "vitest";
import {
  normalizeForPretrained,
  PretrainedAlphabetClassifier,
  PRETRAINED_MIN_CONFIDENCE,
} from "@/engine/asl-alphabet-pretrained";

const hand = Array.from({ length: 21 }, (_, i) => ({ x: 0.5 + i * 0.01, y: 0.6 - i * 0.02, z: i * 0.001 }));
const labels = ["0", "1", "A", "B"];
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("normalizeForPretrained", () => {
  it("matches the model card: wrist-relative, scaled by |landmark 9|, no mirroring", () => {
    const out = normalizeForPretrained(hand)!;
    expect(out.length).toBe(63);
    expect([out[0], out[1], out[2]]).toEqual([0, 0, 0]);
    expect(Math.hypot(out[27], out[28], out[29])).toBeCloseTo(1, 5);
    expect(out[3]).toBeGreaterThan(0); // x keeps its sign
  });
});

describe("PretrainedAlphabetClassifier", () => {
  it("returns the latest confident letter, ignoring digits", async () => {
    // Digit "1" has the largest logit but must be ignored; "B" wins among letters.
    const classifier = new PretrainedAlphabetClassifier(async () => Float32Array.from([0, 20, 0, 10]), labels);
    expect(classifier.classify(hand, "right")).toBeNull(); // first call only starts inference
    await flush();
    const result = classifier.classify(hand, "right");
    expect(result?.letter).toBe("B");
    expect(result!.confidence).toBeGreaterThanOrEqual(PRETRAINED_MIN_CONFIDENCE);
  });

  it("drops unsure frames and clears when the hand leaves", async () => {
    const classifier = new PretrainedAlphabetClassifier(async () => Float32Array.from([0, 0, 1, 1]), labels);
    classifier.classify(hand, "right");
    await flush();
    expect(classifier.classify(hand, "right")).toBeNull(); // 50/50 between A and B
    expect(classifier.classify(null, "unknown")).toBeNull();
  });
});
