import { describe, expect, it } from "vitest";
import { classifyCustomGesture } from "../engine/custom-gesture-store";
import { normalizeHandLandmarks } from "../engine/asl-alphabet";
import type { Landmark } from "../engine/landmarks";
import type { StoredCustomGesture } from "../lib/storage";
import { hand } from "./hand-fixture";

const UP = 0.2;
const DOWN = -0.12;
const TUCKED = { x: 0.47, y: 0.72 };
const OUT = { x: 0.25, y: 0.7 };

const openPalm = () => hand([UP, UP, UP, UP], OUT, 2.5);
const fist = () => hand([DOWN, DOWN, DOWN, DOWN], TUCKED);
const pointUp = () => hand([UP, DOWN, DOWN, DOWN], TUCKED);

const shifted = (points: Landmark[], dx: number): Landmark[] => points.map((p) => ({ ...p, x: p.x + dx }));
const vector = (points: Landmark[]) => Array.from(normalizeHandLandmarks(points)!);

function stored(label: string, frames: number[][], hands: 1 | 2 = 1): StoredCustomGesture {
  return { id: label, label, hands, frames, createdAt: 0 };
}

/** A live window of one-hand frames. */
const window1 = (frames: Landmark[][]) => frames.map((points) => [points]);
const hold = (points: Landmark[], count = 12) => window1(Array.from({ length: count }, () => points));

describe("classifyCustomGesture", () => {
  it("matches a held pose to its saved recording, anywhere in frame", () => {
    const saved = [stored("I need water", [vector(pointUp())])];
    const match = classifyCustomGesture(hold(shifted(pointUp(), 0.15)), saved);
    expect(match?.label).toBe("I need water");
    expect(match?.confidence).toBeGreaterThanOrEqual(0.55);
  });

  it("picks the closest of several saved gestures", () => {
    const saved = [stored("open", [vector(openPalm())]), stored("point", [vector(pointUp())])];
    expect(classifyCustomGesture(hold(openPalm()), saved)?.label).toBe("open");
    expect(classifyCustomGesture(hold(pointUp()), saved)?.label).toBe("point");
  });

  it("does not match a clearly different handshape", () => {
    const saved = [stored("open", [vector(openPalm())])];
    expect(classifyCustomGesture(hold(fist()), saved)).toBeNull();
  });

  it("does not fire a motion gesture on a hand held still", () => {
    // Recorded: open palm closing into a fist.
    const motion = Array.from({ length: 12 }, (_, i) => vector(i < 6 ? openPalm() : fist()));
    const saved = [stored("wave", motion)];
    expect(classifyCustomGesture(hold(openPalm()), saved)).toBeNull();
  });

  it("never matches one hand against a two-hand gesture", () => {
    const two = [...vector(openPalm()), ...vector(shifted(openPalm(), 0.4))];
    const saved = [stored("both", [two], 2)];
    expect(classifyCustomGesture(hold(openPalm()), saved)).toBeNull();
  });

  it("returns nothing with no saved gestures or no hands", () => {
    expect(classifyCustomGesture(hold(openPalm()), [])).toBeNull();
    expect(classifyCustomGesture([], [stored("x", [vector(openPalm())])])).toBeNull();
  });
});
