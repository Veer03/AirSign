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
  { id: "thumbs-up", gesture: "Thumb_Up", label: "Thumbs up", text: "Thumbs up" },
  { id: "thumbs-down", gesture: "Thumb_Down", label: "Thumbs down", text: "Thumbs down" },
  { id: "victory", gesture: "Victory", label: "Victory", text: "Yes, that one" },
  { id: "open-palm", gesture: "Open_Palm", label: "Open palm", text: "Please wait" },
  { id: "closed-fist", gesture: "Closed_Fist", label: "Closed fist", text: "Stop" },
  { id: "pointing-up", gesture: "Pointing_Up", label: "Pointing up", text: "One moment please" },
  { id: "love-you", gesture: "ILoveYou", label: "I love you", text: "Thank you" },
  { id: "middle-finger", gesture: "Middle_Finger", label: "Middle finger", text: "Fuck you" },
];

const byGesture = new Map<GestureId, Phrase>(
  STARTER_PHRASES.map((phrase) => [phrase.gesture, phrase]),
);

export function phraseForGesture(gesture: GestureId): Phrase | undefined {
  return byGesture.get(gesture);
}

/** Keyboard fallback: keys 1–8 dispatch the same events as the camera. */
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
