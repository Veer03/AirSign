import { MIN_CONFIDENCE, type GestureId, type HandSide } from "@/lib/contracts";
import { phraseForGesture } from "@/lib/starter-phrases";
import { matchCombo } from "./combos";
import type { LandmarkFrame } from "./landmark-buffer";
import { isGestureId } from "./stabilize";

export type SignResult = {
  /** Stable id used by the stabilizer; gesture id or combo id. */
  id: string;
  label: string;
  phrase: string;
  gesture: GestureId;
  hands: 1 | 2;
  side?: HandSide;
  confidence: number;
  model: string;
};

/**
 * The swap point for real sign recognition. Today the local stub resolves
 * MediaPipe labels and two-hand pairs; later an on-device model (or a remote
 * one behind an API route) implements the same interface.
 */
export interface SignRecognizer {
  readonly model: string;
  recognize(window: LandmarkFrame[]): SignResult | null;
}

export class LocalStubRecognizer implements SignRecognizer {
  readonly model = "local-stub";

  recognize(window: LandmarkFrame[]): SignResult | null {
    const latest = window[window.length - 1];
    if (!latest) return null;

    const valid = latest.hands.filter(
      (hand) =>
        hand.landmarks !== null &&
        hand.confidence >= MIN_CONFIDENCE &&
        isGestureId(hand.gesture),
    );

    // Two recognized hands: only a known pair can lock. This is what stops
    // two independent classifiers from producing two unrelated phrases.
    if (valid.length >= 2) {
      const pair = valid.slice(0, 2);
      const combo = matchCombo(pair.map((hand) => hand.gesture as GestureId));
      if (!combo) {
        // A single custom pose still counts when the resting hand receives an
        // unrelated built-in label. Matching custom pairs take precedence.
        const customHand = pair.find(
          (hand) =>
            hand.gesture === "Wow" ||
            hand.gesture === "Finger_Heart" ||
            hand.gesture === "Gun" ||
            hand.gesture === "Middle_Finger",
        );
        if (customHand) {
          const phrase = phraseForGesture(customHand.gesture as GestureId);
          if (!phrase) return null;
          return {
            id: phrase.id,
            label: phrase.label,
            phrase: phrase.text,
            gesture: phrase.gesture,
            hands: 1,
            side: customHand.side,
            confidence: customHand.confidence,
            model: this.model,
          };
        }
        return null;
      }

      return {
        id: combo.id,
        label: combo.label,
        phrase: combo.text,
        gesture: combo.gesture,
        hands: 2,
        confidence: Math.min(...pair.map((hand) => hand.confidence)),
        model: this.model,
      };
    }

    // One recognized hand: a single-hand gesture can lock even if the other
    // hand is visible but neutral/unrecognized.
    if (valid.length === 1) {
      const hand = valid[0];
      const phrase = phraseForGesture(hand.gesture as GestureId);
      if (!phrase) return null;

      return {
        id: phrase.id,
        label: phrase.label,
        phrase: phrase.text,
        gesture: phrase.gesture,
        hands: 1,
        side: hand.side,
        confidence: hand.confidence,
        model: this.model,
      };
    }

    return null;
  }
}
