import { describe, expect, it } from "vitest";
import { GestureStabilizer } from "../engine/stabilize";

const up = { gesture: "Thumb_Up", confidence: 0.9 };
const down = { gesture: "Thumb_Down", confidence: 0.9 };

describe("GestureStabilizer", () => {
  it("locks once after stable frames plus dwell, then cools down", () => {
    const s = new GestureStabilizer(100, 2, 500);

    expect(s.push(up, 0).locked).toBeNull();
    expect(s.push(up, 33).locked).toBeNull();
    expect(s.push(up, 100).progress).toBeGreaterThan(0);

    const lock = s.push(up, 133);
    expect(lock.locked).toBe("Thumb_Up");
    expect(lock.progress).toBe(1);

    // Same pose held: no duplicate lock during cooldown.
    for (let t = 150; t < 600; t += 33) {
      expect(s.push(up, t).locked).toBeNull();
    }
  });

  it("never locks on an alternating gesture", () => {
    const s = new GestureStabilizer(50, 2, 0);
    expect(s.push(up, 0).locked).toBeNull();
    expect(s.push(down, 33).locked).toBeNull();
    expect(s.push(up, 66).locked).toBeNull();
    expect(s.push(down, 99).locked).toBeNull();
  });

  it("ignores low confidence and None", () => {
    const s = new GestureStabilizer(0, 1, 0);
    expect(s.push({ gesture: "Thumb_Up", confidence: 0.2 }, 0).locked).toBeNull();
    expect(s.push({ gesture: "None", confidence: 0.99 }, 10).locked).toBeNull();
    expect(s.push(null, 20).locked).toBeNull();
  });

  it("locks again after cooldown expires and the pose is re-formed", () => {
    const s = new GestureStabilizer(0, 1, 100);
    expect(s.push(up, 0).locked).toBe("Thumb_Up");
    expect(s.push(up, 50).locked).toBeNull();
    expect(s.push(up, 150).locked).toBe("Thumb_Up");
  });

  it("waits the repeat delay before re-locking the same held gesture", () => {
    const s = new GestureStabilizer(0, 1, 0, 3000);

    expect(s.push(up, 0).locked).toBe("Thumb_Up");

    const early = s.push(up, 1000);
    expect(early.locked).toBeNull();
    expect(early.repeatWaitMs).toBe(2000);
    expect(s.push(up, 2999).locked).toBeNull();
    expect(s.push(up, 3000).locked).toBe("Thumb_Up");
  });

  it("does not delay a different gesture", () => {
    const s = new GestureStabilizer(0, 1, 0, 3000);
    expect(s.push(up, 0).locked).toBe("Thumb_Up");
    expect(s.push(down, 100).locked).toBe("Thumb_Down");
  });

  it("ignores a brief dropout and keeps waiting", () => {
    const s = new GestureStabilizer(0, 1, 0, 3000);
    expect(s.push(up, 0).locked).toBe("Thumb_Up");
    expect(s.push(null, 100).locked).toBeNull();
    expect(s.push(up, 133).locked).toBeNull();
    expect(s.push(up, 500).locked).toBeNull();
    expect(s.push(up, 3000).locked).toBe("Thumb_Up");
  });

  it("re-arms after a sustained release and the same gesture returns", () => {
    const s = new GestureStabilizer(0, 1, 0, 3000);
    expect(s.push(up, 0).locked).toBe("Thumb_Up");
    expect(s.push(null, 100).locked).toBeNull();
    expect(s.push(null, 501).locked).toBeNull();
    expect(s.push(up, 600).locked).toBe("Thumb_Up");
  });
});
