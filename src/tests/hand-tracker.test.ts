import { describe, expect, it } from "vitest";
import { HandTracker } from "../engine/hand-tracker";
import type { RawHand } from "../engine/recognizer";
import type { Landmark } from "../engine/landmarks";

function hand(gesture: string, cx: number, cy = 0.5, confidence = 0.9): RawHand {
  const landmarks: Landmark[] = Array.from({ length: 21 }, () => ({ x: cx, y: cy, z: 0 }));
  return { side: "unknown", gesture, confidence, landmarks };
}

describe("HandTracker", () => {
  it("keeps stable ids when MediaPipe swaps hand order", () => {
    const tracker = new HandTracker();

    const first = tracker.update([hand("Open_Palm", 0.2), hand("Closed_Fist", 0.8)], 0);
    expect(first.map((h) => h.gesture)).toEqual(["Open_Palm", "Closed_Fist"]);
    const [leftId, rightId] = first.map((h) => h.id);
    expect(leftId).not.toBe(rightId);

    // Same physical hands, reversed order and a small jitter.
    const second = tracker.update([hand("Closed_Fist", 0.81), hand("Open_Palm", 0.19)], 33);
    expect(second[0].gesture).toBe("Closed_Fist");
    expect(second[0].id).toBe(rightId);
    expect(second[1].gesture).toBe("Open_Palm");
    expect(second[1].id).toBe(leftId);
  });

  it("assigns a new id after the hand has been unseen past the ttl", () => {
    const tracker = new HandTracker(0.3, 400);

    const first = tracker.update([hand("Open_Palm", 0.5)], 0);
    expect(first).toHaveLength(1);

    const later = tracker.update([hand("Open_Palm", 0.5)], 1000);
    expect(later).toHaveLength(1);
    expect(later[0].id).not.toBe(first[0].id);
  });

  it("does not merge a hand that jumps beyond the match radius", () => {
    const tracker = new HandTracker(0.1, 400);

    const first = tracker.update([hand("Open_Palm", 0.1)], 0);
    const jumped = tracker.update([hand("Open_Palm", 0.9)], 33);
    expect(jumped[0].id).not.toBe(first[0].id);
  });

  it("matches a missing landmark set to the centre rather than dropping the hand", () => {
    const tracker = new HandTracker();
    const result = tracker.update(
      [{ side: "left", gesture: "None", confidence: 0, landmarks: null }],
      0,
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("h1");
  });
});
