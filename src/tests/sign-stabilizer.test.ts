import { describe, expect, it } from "vitest";
import { SignStabilizer } from "../engine/stabilize";

const sign = (id: string, confidence = 0.9) => ({ sign: id, confidence });

describe("SignStabilizer", () => {
  it("locks a sign id once after stable frames plus dwell", () => {
    const s = new SignStabilizer(100, 2, 500);

    expect(s.push(sign("combo-help"), 0).locked).toBeNull();
    expect(s.push(sign("combo-help"), 33).locked).toBeNull();
    const lock = s.push(sign("combo-help"), 133);
    expect(lock.locked).toBe("combo-help");
    expect(lock.progress).toBe(1);
  });

  it("does not double-lock during cooldown", () => {
    const s = new SignStabilizer(0, 1, 500);
    expect(s.push(sign("thumbs-up"), 0).locked).toBe("thumbs-up");
    expect(s.push(sign("thumbs-up"), 100).locked).toBeNull();
    expect(s.push(sign("thumbs-up"), 400).locked).toBeNull();
  });

  it("treats a changing sign as unstable", () => {
    const s = new SignStabilizer(0, 2, 0);
    expect(s.push(sign("thumbs-up"), 0).locked).toBeNull();
    expect(s.push(sign("combo-help"), 33).locked).toBeNull();
    expect(s.push(sign("thumbs-up"), 66).locked).toBeNull();
    expect(s.push(sign("combo-help"), 99).locked).toBeNull();
  });

  it("ignores low confidence and missing signs", () => {
    const s = new SignStabilizer(0, 1, 0);
    expect(s.push(sign("thumbs-up", 0.2), 0).locked).toBeNull();
    expect(s.push(null, 10).locked).toBeNull();
  });

  it("supports a longer dwell for two-hand combos", () => {
    const s = new SignStabilizer(100, 2, 500);
    expect(s.push(sign("combo-help"), 0, 400).locked).toBeNull();
    expect(s.push(sign("combo-help"), 33, 400).locked).toBeNull();
    expect(s.push(sign("combo-help"), 133, 400).locked).toBeNull();
    expect(s.push(sign("combo-help"), 434, 400).locked).toBe("combo-help");
  });

  it("waits the repeat delay before re-locking a held sign", () => {
    const s = new SignStabilizer(0, 1, 0, 2500);

    expect(s.push(sign("thumbs-up"), 0).locked).toBe("thumbs-up");

    const early = s.push(sign("thumbs-up"), 1000);
    expect(early.locked).toBeNull();
    expect(early.repeatWaitMs).toBe(1500);
    expect(s.push(sign("thumbs-up"), 2499).locked).toBeNull();
    expect(s.push(sign("thumbs-up"), 2500).locked).toBe("thumbs-up");
  });
});
