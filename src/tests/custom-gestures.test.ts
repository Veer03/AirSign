import { describe, expect, it } from "vitest";
import { detectCustomGesture } from "../engine/custom-gestures";
import type { Landmark } from "../engine/landmarks";

const FINGERS = {
  index: { mcp: 5, pip: 6, dip: 7, tip: 8, x: 0.46 },
  middle: { mcp: 9, pip: 10, dip: 11, tip: 12, x: 0.5 },
  ring: { mcp: 13, pip: 14, dip: 15, tip: 16, x: 0.54 },
  pinky: { mcp: 17, pip: 18, dip: 19, tip: 20, x: 0.58 },
} as const;

/** Builds a hand pointing up, with each finger either extended or curled. */
function makeHand(extended: Record<keyof typeof FINGERS, boolean>): Landmark[] {
  const points: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.9, z: 0 }));

  for (const [name, finger] of Object.entries(FINGERS)) {
    const isExtended = extended[name as keyof typeof FINGERS];
    const { mcp, pip, dip, tip, x } = finger;

    points[mcp] = { x, y: 0.7, z: 0 };
    points[pip] = { x, y: 0.6, z: 0 };
    points[dip] = { x, y: isExtended ? 0.52 : 0.66, z: 0 };
    points[tip] = { x, y: isExtended ? 0.44 : 0.72, z: 0 };
  }

  return points;
}

const curled = { index: false, middle: false, ring: false, pinky: false };

function makeFingerHeart(pinched: boolean): Landmark[] {
  const points = makeHand(curled);
  points[8] = { x: 0.46, y: 0.56, z: 0 };
  // 0.6 palm lengths apart is a loose pose, not a clear fingertip pinch.
  points[4] = { x: pinched ? 0.46 : 0.58, y: 0.56, z: 0 };
  return points;
}

describe("detectCustomGesture", () => {
  it("detects a middle finger with the other fingers curled", () => {
    const result = detectCustomGesture(makeHand({ ...curled, middle: true }));
    expect(result?.gesture).toBe("Middle_Finger");
    expect(result?.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("ignores an open palm", () => {
    expect(
      detectCustomGesture(makeHand({ index: true, middle: true, ring: true, pinky: true })),
    ).toBeNull();
  });

  it("ignores a pointing-up hand", () => {
    expect(detectCustomGesture(makeHand({ ...curled, index: true }))).toBeNull();
  });

  it("ignores a victory sign", () => {
    expect(detectCustomGesture(makeHand({ ...curled, index: true, middle: true }))).toBeNull();
  });

  it("ignores a closed fist", () => {
    expect(detectCustomGesture(makeHand(curled))).toBeNull();
  });

  it("recognizes a clear Korean finger-heart pinch", () => {
    expect(detectCustomGesture(makeFingerHeart(true))?.gesture).toBe("Finger_Heart");
  });

  it("does not call a loose thumb-index pose a finger heart", () => {
    expect(detectCustomGesture(makeFingerHeart(false))).toBeNull();
  });

  it("ignores missing or incomplete landmarks", () => {
    expect(detectCustomGesture(null)).toBeNull();
    expect(detectCustomGesture([])).toBeNull();
    expect(detectCustomGesture(makeHand({ ...curled, middle: true }).slice(0, 12))).toBeNull();
  });
});
