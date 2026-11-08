import { describe, expect, it } from "vitest";
import { LocalStubRecognizer } from "../engine/sign-recognizer";
import type { LandmarkFrame, LandmarkHand } from "../engine/landmark-buffer";
import type { Landmark } from "../engine/landmarks";

const landmarks: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

function hand(
  gesture: string,
  side: LandmarkHand["side"] = "unknown",
  confidence = 0.9,
): LandmarkHand {
  return { id: `hand-${gesture}-${side}`, side, gesture, confidence, landmarks };
}

function frame(...hands: LandmarkHand[]): LandmarkFrame {
  return { t: 0, hands };
}

describe("LocalStubRecognizer", () => {
  const recognizer = new LocalStubRecognizer();

  it("resolves a known two-hand pair and reports the lower confidence", () => {
    const result = recognizer.recognize(
      [frame(hand("Open_Palm", "left", 0.92), hand("Pointing_Up", "right", 0.74))],
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe("combo-wait");
    expect(result?.phrase).toBe("One moment please");
    expect(result?.hands).toBe(2);
    expect(result?.confidence).toBeCloseTo(0.74);
  });

  it("refuses to lock two independent single-hand gestures", () => {
    const result = recognizer.recognize(
      [frame(hand("Open_Palm", "left"), hand("Closed_Fist", "right"))],
    );
    expect(result).toBeNull();
  });

  it("locks a single hand when the other hand is neutral", () => {
    const result = recognizer.recognize(
      [frame(hand("Thumb_Up", "right"), hand("None", "left", 0.9))],
    );

    expect(result?.hands).toBe(1);
    expect(result?.phrase).toBe("Thumbs up");
    expect(result?.side).toBe("right");
  });

  it("locks the middle-finger starter phrase", () => {
    const result = recognizer.recognize([frame(hand("Middle_Finger", "right"))]);
    expect(result?.hands).toBe(1);
    expect(result?.phrase).toBe("Fuck you");
    expect(result?.side).toBe("right");
  });

  it("ignores low-confidence and unknown labels", () => {
    expect(
      recognizer.recognize([frame(hand("Open_Palm", "left", 0.2), hand("Open_Palm", "right", 0.2))]),
    ).toBeNull();
    expect(recognizer.recognize([frame(hand("None", "left", 0.99))])).toBeNull();
  });

  it("returns null for an empty window", () => {
    expect(recognizer.recognize([])).toBeNull();
    expect(recognizer.recognize([frame()])).toBeNull();
  });
});
