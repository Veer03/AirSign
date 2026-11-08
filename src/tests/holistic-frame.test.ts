import { describe, expect, it } from "vitest";
import {
  FRAME_VALUES,
  frameHasHand,
  frameTo543,
  stackFrames,
} from "@/engine/holistic-frame";

const pts = (n: number, x: number) => Array.from({ length: n }, (_, i) => ({ x, y: i / 100, z: 0.01 }));

// Index helpers: point index -> flat offset of its x value.
const at = (point: number) => point * 3;

describe("frameTo543", () => {
  it("fills everything with NaN when nothing is detected", () => {
    const frame = frameTo543({});
    expect(frame.length).toBe(FRAME_VALUES);
    expect(FRAME_VALUES).toBe(1629);
    expect(frame.every(Number.isNaN)).toBe(true);
    expect(frameHasHand(frame)).toBe(false);
  });

  it("uses the asl-signs block order and truncates the face to 468", () => {
    const frame = frameTo543({
      faceLandmarks: [pts(478, 0.1)],
      leftHandLandmarks: [pts(21, 0.2)],
      poseLandmarks: [pts(33, 0.3)],
      rightHandLandmarks: [pts(21, 0.4)],
    });
    expect(frame[at(0)]).toBeCloseTo(0.1);
    expect(frame[at(467)]).toBeCloseTo(0.1);
    expect(frame[at(468)]).toBeCloseTo(0.2); // left hand starts right after 468 face points
    expect(frame[at(488)]).toBeCloseTo(0.2);
    expect(frame[at(489)]).toBeCloseTo(0.3); // pose
    expect(frame[at(521)]).toBeCloseTo(0.3);
    expect(frame[at(522)]).toBeCloseTo(0.4); // right hand
    expect(frame[at(542)]).toBeCloseTo(0.4);
    expect(frameHasHand(frame)).toBe(true);
  });

  it("leaves a missing part as NaN", () => {
    const frame = frameTo543({ rightHandLandmarks: [pts(21, 0.4)] });
    expect(Number.isNaN(frame[at(468)])).toBe(true);
    expect(Number.isNaN(frame[at(0)])).toBe(true);
    expect(frame[at(522)]).toBeCloseTo(0.4);
  });

  it("mirror flips x and swaps hands; swapHands alone only swaps", () => {
    const input = { leftHandLandmarks: [pts(21, 0.2)] };

    const mirrored = frameTo543(input, { mirror: true });
    expect(Number.isNaN(mirrored[at(468)])).toBe(true);
    expect(mirrored[at(522)]).toBeCloseTo(0.8);

    const swapped = frameTo543(input, { swapHands: true });
    expect(swapped[at(522)]).toBeCloseTo(0.2);

    const both = frameTo543(input, { mirror: true, swapHands: true });
    expect(both[at(468)]).toBeCloseTo(0.8);
  });

  it("stacks frames back to back", () => {
    const a = frameTo543({ leftHandLandmarks: [pts(21, 0.2)] });
    const b = frameTo543({ rightHandLandmarks: [pts(21, 0.4)] });
    const stacked = stackFrames([a, b]);
    expect(stacked.length).toBe(2 * FRAME_VALUES);
    expect(stacked[FRAME_VALUES + at(522)]).toBeCloseTo(0.4);
  });
});
