import { describe, expect, it } from "vitest";
import { classifyASLNumber } from "../engine/asl-numbers";
import type { Landmark } from "../engine/landmarks";
import { hand } from "./hand-fixture";

const TUCKED = { x: 0.47, y: 0.72 };
const OUT = { x: 0.25, y: 0.7 };
const UP = 0.2;
const DOWN = -0.12;

/** O: index and middle tips curve round to meet the thumb; ring and pinky curled. */
function oShape(): Landmark[] {
  const points = hand([DOWN, DOWN, DOWN, DOWN], { x: 0.4, y: 0.63 });
  points[7] = { x: 0.42, y: 0.58, z: 0 };
  points[8] = { x: 0.4, y: 0.6, z: 0 };
  points[11] = { x: 0.45, y: 0.58, z: 0 };
  points[12] = { x: 0.42, y: 0.62, z: 0 };
  return points;
}

describe("classifyASLNumber handshape distinctions", () => {
  it("reads a spread V as 2 but rejects fingers held together (U/H)", () => {
    expect(classifyASLNumber(hand([UP, UP, DOWN, DOWN], TUCKED, 3))).toBe(2);
    expect(classifyASLNumber(hand([UP, UP, DOWN, DOWN], TUCKED, 1))).toBeNull();
  });

  it("needs the thumb out for 3, so a V with the thumb tucked is not 3", () => {
    expect(classifyASLNumber(hand([UP, UP, DOWN, DOWN], OUT, 3))).toBe(3);
    expect(classifyASLNumber(hand([UP, UP, DOWN, DOWN], TUCKED, 3))).not.toBe(3);
  });

  it("reads index-only as 1, but not with the thumb held out (L)", () => {
    expect(classifyASLNumber(hand([UP, DOWN, DOWN, DOWN], TUCKED))).toBe(1);
    expect(classifyASLNumber(hand([UP, DOWN, DOWN, DOWN], OUT))).toBeNull();
  });

  it("reads spread fingers as 4/5 but rejects a flat B with fingers together", () => {
    expect(classifyASLNumber(hand([UP, UP, UP, UP], TUCKED, 3))).toBe(4);
    expect(classifyASLNumber(hand([UP, UP, UP, UP], OUT, 3))).toBe(5);
    expect(classifyASLNumber(hand([UP, UP, UP, UP], TUCKED, 1))).toBeNull();
  });

  it("reads an open O as 0 and a thumbs-up fist as 10", () => {
    expect(classifyASLNumber(oShape())).toBe(0);
    expect(classifyASLNumber(hand([DOWN, DOWN, DOWN, DOWN], OUT))).toBe(10);
  });

  it("rejects a closed fist with the thumb tucked (E/S)", () => {
    expect(classifyASLNumber(hand([DOWN, DOWN, DOWN, DOWN], TUCKED))).toBeNull();
  });
});
