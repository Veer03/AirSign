import type { GestureId } from "@/lib/contracts";

/**
 * Two-hand starter combos. These are arbitrary pairings, not ASL — the UI
 * must keep saying so. Pairs are unordered: left/right can be swapped.
 */
export type ComboDef = {
  id: string;
  label: string;
  text: string;
  /** The two handshapes that form the combo. */
  pair: [GestureId, GestureId];
  /** Gesture used for the event's type field. */
  gesture: GestureId;
};

export const STARTER_COMBOS: ComboDef[] = [
  {
    id: "combo-help",
    label: "Both palms",
    text: "I need help",
    pair: ["Open_Palm", "Open_Palm"],
    gesture: "Open_Palm",
  },
  {
    id: "combo-stop",
    label: "Both fists",
    text: "Stop",
    pair: ["Closed_Fist", "Closed_Fist"],
    gesture: "Closed_Fist",
  },
  {
    id: "combo-yes",
    label: "Double thumbs up",
    text: "Yes",
    pair: ["Thumb_Up", "Thumb_Up"],
    gesture: "Thumb_Up",
  },
  {
    id: "combo-no",
    label: "Double thumbs down",
    text: "No",
    pair: ["Thumb_Down", "Thumb_Down"],
    gesture: "Thumb_Down",
  },
  {
    id: "combo-thanks",
    label: "Double I-love-you",
    text: "Thank you",
    pair: ["ILoveYou", "ILoveYou"],
    gesture: "ILoveYou",
  },
  {
    id: "combo-wait",
    label: "Palm and point",
    text: "One moment please",
    pair: ["Open_Palm", "Pointing_Up"],
    gesture: "Open_Palm",
  },
  {
    id: "combo-okay",
    label: "Double victory",
    text: "Okay",
    pair: ["Victory", "Victory"],
    gesture: "Victory",
  },
];

const pairKey = (a: GestureId, b: GestureId) => [a, b].sort().join("|");

const byPair = new Map<string, ComboDef>(
  STARTER_COMBOS.map((combo) => [pairKey(combo.pair[0], combo.pair[1]), combo]),
);

export function matchCombo(gestures: GestureId[]): ComboDef | undefined {
  if (gestures.length !== 2) return undefined;
  return byPair.get(pairKey(gestures[0], gestures[1]));
}
