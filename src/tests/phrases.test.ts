import { describe, expect, it } from "vitest";
import { makeGestureEvent, phraseForGesture, phraseForKey, STARTER_PHRASES } from "../lib/starter-phrases";

describe("starter phrases", () => {
  it("maps every keyboard key 1-9 to a distinct phrase", () => {
    const phrases = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => phraseForKey(key));
    expect(phrases.every(Boolean)).toBe(true);
    expect(new Set(phrases.map((p) => p?.id)).size).toBe(9);
    expect(phraseForKey("0")).toBeUndefined();
    expect(phraseForKey("x")).toBeUndefined();
  });

  it("maps MediaPipe gestures to phrases", () => {
    expect(phraseForGesture("Thumb_Up")?.text).toBe("Yes, I agree.");
    expect(phraseForGesture("Middle_Finger")?.text).toBe("That's rude.");
    expect(STARTER_PHRASES).toHaveLength(10);
  });

  it("builds a complete gesture event", () => {
    const phrase = STARTER_PHRASES[0];
    const event = makeGestureEvent(phrase, 0.91, "keyboard");
    expect(event.gesture).toBe("Thumb_Up");
    expect(event.phrase).toBe("Yes, I agree.");
    expect(event.confidence).toBe(0.91);
    expect(event.source).toBe("keyboard");
    expect(event.id).toContain("yes");
  });
});
