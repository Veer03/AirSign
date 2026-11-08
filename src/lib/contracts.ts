/**
 * Shared contracts between lanes. Frozen once the app runs — announce changes.
 * These are the only shapes that cross component / engine / API boundaries.
 */

export type GestureId =
  | "Thumb_Up"
  | "Thumb_Down"
  | "Victory"
  | "Open_Palm"
  | "Closed_Fist"
  | "Pointing_Up"
  | "ILoveYou"
  | "Middle_Finger"
  | "Finger_Heart"
  | "Wow"
  | `ASL_${"A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"}`;

export type GestureSource = "camera" | "keyboard" | "custom";

/** Which physical hand produced the gesture. MediaPipe labels are corrected for our unmirrored video. */
export type HandSide = "left" | "right" | "unknown";

export type GestureEvent = {
  /** Stable per-event id, used as a React key. */
  id: string;
  gesture: GestureId | "Unknown";
  /** Human-facing label, e.g. "Thumbs up". */
  label: string;
  /** What will be spoken / added to the sentence. */
  phrase: string;
  confidence: number;
  at: number;
  source: GestureSource;
  /** How many hands formed this phrase: a single-hand gesture or a two-hand combo. */
  hands?: 1 | 2;
  /** Set for single-hand events. */
  side?: HandSide;
  /** True when the phrase came from a two-hand pair. */
  combo?: boolean;
};

export type GestureState = "idle" | "starting" | "ready" | "denied" | "error" | "no-hand";

/** A hand currently visible in the frame, as shown in the camera panel. */
export type HandCandidate = {
  /** Stable id assigned by the centroid tracker. */
  id: string;
  side: HandSide;
  /** Null when the hand is visible but the classifier has no confident label. */
  gesture: GestureId | null;
  label: string;
  confidence: number;
};

/** The phrase the recognizer currently proposes, single-hand or two-hand. */
export type SignCandidate = {
  id: string;
  label: string;
  phrase: string;
  confidence: number;
  hands: 1 | 2;
  side?: HandSide;
};

export type Phrase = {
  id: string;
  gesture: GestureId;
  label: string;
  text: string;
};

export type VoiceKey = "warm" | "calm" | "energetic";

export type Settings = {
  dwellMs: number;
  /**
   * How long to wait before the same held signal may speak again. Changing the
   * gesture or dropping the hand re-arms it immediately.
   */
  repeatMs: number;
  autoSpeak: boolean;
  voice: VoiceKey;
  textScale: number;
  reducedMotion: boolean;
  /** Recognize two-hand combos. Off = best single hand only. */
  twoHands: boolean;
};

export type SpeakRequest = {
  text: string;
  voice: VoiceKey;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export const DEFAULT_SETTINGS: Settings = {
  dwellMs: 250,
  repeatMs: 3000,
  autoSpeak: true,
  voice: "warm",
  textScale: 1,
  reducedMotion: false,
  twoHands: true,
};

export const ABORT_COOLDOWN_MS = 800;
export const MIN_CONFIDENCE = 0.5;
