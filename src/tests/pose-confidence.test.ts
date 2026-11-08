import { describe, expect, it } from "vitest";
import { clarity, poseConfidence, POSE_CEILING, POSE_FLOOR } from "../engine/pose-confidence";
import { knnConfidence } from "../engine/asl-alphabet";
import { classifyASLNumberWithConfidence } from "../engine/asl-numbers";
import { detectCustomGesture } from "../engine/custom-gestures";
import { MIN_CONFIDENCE } from "../lib/contracts";
import { hand } from "./hand-fixture";

describe("clarity", () => {
  it("is 0 at the threshold and 1 at the clear point, in both directions", () => {
    expect(clarity(1.12, 1.12, 1.4)).toBe(0);
    expect(clarity(1.4, 1.12, 1.4)).toBe(1);
    expect(clarity(2, 1.12, 1.4)).toBe(1);
    expect(clarity(0.95, 1.12, 0.95)).toBe(1);
    expect(clarity(1.035, 1.12, 0.95)).toBeCloseTo(0.5);
  });
});

describe("poseConfidence", () => {
  it("spans floor to ceiling and stays above the lock gate", () => {
    expect(poseConfidence([0, 0])).toBe(POSE_FLOOR);
    expect(poseConfidence([1, 1])).toBeCloseTo(POSE_CEILING);
    expect(POSE_FLOOR).toBeGreaterThan(MIN_CONFIDENCE);
  });

  it("is held back by the weakest feature", () => {
    expect(poseConfidence([1, 1, 1, 0])).toBeLessThan(poseConfidence([0.75, 0.75, 0.75, 0.75]));
  });
});

describe("knnConfidence", () => {
  it("rises with more votes and closer neighbours", () => {
    expect(knnConfidence(5, [0.1, 0.1, 0.1, 0.1, 0.1])).toBeGreaterThan(knnConfidence(5, [2, 2, 2, 2, 2]));
    expect(knnConfidence(5, [1, 1, 1, 1, 1])).toBeGreaterThan(knnConfidence(3, [1, 1, 1]));
    expect(knnConfidence(5, [0, 0, 0, 0, 0])).toBeLessThanOrEqual(0.99);
    expect(knnConfidence(3, [7, 7, 7])).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
  });

  it("gives a near-exact 5/5 match at least 0.95", () => {
    expect(knnConfidence(5, [0.05, 0.08, 0.1, 0.12, 0.15])).toBeGreaterThanOrEqual(0.95);
  });
});

const THUMB_TUCKED = { x: 0.47, y: 0.72 };

describe("classifyASLNumberWithConfidence", () => {
  it("scores a crisp 1 higher than a barely-raised 1", () => {
    const crisp = classifyASLNumberWithConfidence(hand([0.2, -0.12, -0.12, -0.12], THUMB_TUCKED));
    const sloppy = classifyASLNumberWithConfidence(hand([0.05, -0.02, -0.02, -0.02], THUMB_TUCKED));
    expect(crisp?.value).toBe(1);
    expect(sloppy?.value).toBe(1);
    expect(crisp!.confidence).toBeGreaterThan(sloppy!.confidence);
    expect(crisp!.confidence).toBeGreaterThanOrEqual(0.95);
    expect(sloppy!.confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
  });

  it("scores a wide-open 5 higher than a hesitant one", () => {
    const crisp = classifyASLNumberWithConfidence(hand([0.2, 0.2, 0.2, 0.2], { x: 0.25, y: 0.7 }, 3));
    const hesitant = classifyASLNumberWithConfidence(hand([0.08, 0.08, 0.08, 0.08], { x: 0.36, y: 0.7 }, 2.2));
    expect(crisp?.value).toBe(5);
    expect(hesitant?.value).toBe(5);
    expect(crisp!.confidence).toBeGreaterThan(hesitant!.confidence);
  });
});

describe("custom gesture confidence", () => {
  it("scores a clear middle finger higher than a borderline one", () => {
    const clear = detectCustomGesture(hand([-0.12, 0.25, -0.12, -0.12], THUMB_TUCKED));
    const borderline = detectCustomGesture(hand([-0.01, 0.1, -0.01, -0.01], THUMB_TUCKED));
    expect(clear?.gesture).toBe("Middle_Finger");
    expect(borderline?.gesture).toBe("Middle_Finger");
    expect(clear!.confidence).toBeGreaterThan(borderline!.confidence);
  });
});
