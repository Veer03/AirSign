import type {
  GestureEvent,
  GestureId,
  GestureSource,
  HandSide,
  Phrase,
} from "./contracts";

/**
 * Starter gestures are arbitrary mappings, not ASL. The UI must label them
 * as such. Labels below are MediaPipe's built-in category names.
 */
export const STARTER_PHRASES: Phrase[] = [
  { id: "yes", gesture: "Thumb_Up", label: "Thumbs up", text: "Yes, I agree." },
  { id: "no", gesture: "Thumb_Down", label: "Thumbs down", text: "No, I don't agree." },
  { id: "ok", gesture: "Victory", label: "Victory", text: "Okay, sounds good." },
  { id: "hello", gesture: "Open_Palm", label: "Open palm", text: "Hello." },
  { id: "hold", gesture: "Closed_Fist", label: "Closed fist", text: "Please hold on." },
  { id: "question", gesture: "Pointing_Up", label: "Point up", text: "I have a question." },
  { id: "love", gesture: "ILoveYou", label: "I love you", text: "I love you." },
  { id: "middle-finger", gesture: "Middle_Finger", label: "Middle finger", text: "That's rude." },
  { id: "finger-heart", gesture: "Finger_Heart", label: "Finger heart", text: "I love you" },
  { id: "wow", gesture: "Wow", label: "Wow", text: "Wow!" },
];

const byGesture = new Map<GestureId, Phrase>(
  STARTER_PHRASES.map((phrase) => [phrase.gesture, phrase]),
);

export function phraseForGesture(gesture: GestureId): Phrase | undefined {
  if (gesture === "Wow") {
    return { id: "wow", gesture, label: "Wow", text: "Wow!" };
  }
  if (gesture.startsWith("ASL_")) {
    const letter = gesture.slice(4);
    return { id: `asl-${letter.toLowerCase()}`, gesture, label: letter, text: letter };
  }
  return byGesture.get(gesture);
}

/** Keyboard fallback: keys 1–9 dispatch the same events as the camera. */
export function phraseForKey(key: string): Phrase | undefined {
  const index = Number(key) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= STARTER_PHRASES.length) {
    return undefined;
  }
  return STARTER_PHRASES[index];
}

export function makeGestureEvent(
  phrase: Phrase,
  confidence: number,
  source: GestureSource = "camera",
): GestureEvent {
  return {
    id: `${phrase.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    gesture: phrase.gesture,
    label: phrase.label,
    phrase: phrase.text,
    confidence,
    at: Date.now(),
    source,
    hands: 1,
  };
}

/** Builds an event for either a single-hand gesture or a two-hand combo. */
export function makeSignEvent(
  input: {
    id: string;
    label: string;
    phrase: string;
    gesture: GestureId;
    hands: 1 | 2;
    side?: HandSide;
  },
  confidence: number,
  source: GestureSource = "camera",
): GestureEvent {
  return {
    id: `${input.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    gesture: input.gesture,
    label: input.label,
    phrase: input.phrase,
    confidence,
    at: Date.now(),
    source,
    hands: input.hands,
    side: input.side,
    combo: input.hands === 2,
  };
}
