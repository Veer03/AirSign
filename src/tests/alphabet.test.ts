// [alphabet] tests — delete with the feature.
import { describe, expect, it } from "vitest";
import { LetterLock, normalizeHand } from "@/engine/alphabet-classifier";

const hand = Array.from({ length: 21 }, (_, i) => ({ x: 0.5 + i * 0.01, y: 0.6 - i * 0.02, z: i * 0.001 }));

describe("normalizeHand", () => {
  it("is wrist-relative and scaled by |landmark 9|", () => {
    const out = normalizeHand(hand)!;
    expect(out.length).toBe(63);
    expect([out[0], out[1], out[2]]).toEqual([0, 0, 0]);
    const l9 = Math.hypot(out[27], out[28], out[29]);
    expect(l9).toBeCloseTo(1, 5);
  });

  it("mirror negates x only", () => {
    const plain = normalizeHand(hand)!;
    const mirrored = normalizeHand(hand, { mirror: true })!;
    expect(mirrored[30]).toBeCloseTo(-plain[30]);
    expect(mirrored[31]).toBeCloseTo(plain[31]);
  });

  it("rejects incomplete hands", () => {
    expect(normalizeHand(hand.slice(0, 10))).toBeNull();
  });
});

describe("LetterLock", () => {
  it("locks after the hold time, once", () => {
    const lock = new LetterLock(600, 1500, 0.7);
    expect(lock.push("A", 0.9, 0).locked).toBeNull();
    expect(lock.push("A", 0.9, 300).progress).toBeCloseTo(0.5);
    expect(lock.push("A", 0.9, 600).locked).toBe("A");
    expect(lock.push("A", 0.9, 700).locked).toBeNull();
  });

  it("ignores low confidence and re-arms on release", () => {
    const lock = new LetterLock(600, 1500, 0.7);
    lock.push("B", 0.9, 0);
    expect(lock.push("B", 0.9, 600).locked).toBe("B");
    lock.push(null, 0, 700); // hand dropped
    lock.push("B", 0.9, 800);
    expect(lock.push("B", 0.5, 1500).locked).toBeNull(); // too unsure
    lock.push("B", 0.9, 1600);
    expect(lock.push("B", 0.9, 2200).locked).toBe("B");
  });

  it("allows a double letter after holding for the repeat time", () => {
    const lock = new LetterLock(600, 1500, 0.7);
    lock.push("L", 0.9, 0);
    expect(lock.push("L", 0.9, 600).locked).toBe("L");
    expect(lock.push("L", 0.9, 1300).locked).toBeNull();
    expect(lock.push("L", 0.9, 2100).locked).toBe("L");
  });
});
