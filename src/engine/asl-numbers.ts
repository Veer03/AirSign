import type { Landmark } from "./landmarks";
import { clarity, poseConfidence } from "./pose-confidence";

const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const FINGERS = [
  { tip: 8, pip: 6, mcp: 5 },
  { tip: 12, pip: 10, mcp: 9 },
  { tip: 16, pip: 14, mcp: 13 },
  { tip: 20, pip: 18, mcp: 17 },
] as const;

/*
 * Thresholds follow the ASL handshape distinctions used by reverse
 * dictionaries such as Handspeak (2-num vs 2-H/U, 4-num vs 4-close/B, 0-num as
 * an O), and were measured on the labelled letters in asl-landmarks.csv, whose
 * handshapes overlap the numbers: V = 2, W = 6, F = 9, O = 0, A ≈ 10.
 * Each pair is [decision threshold, value where it is unmistakable].
 */
/** wrist→tip vs wrist→pip. */
const EXTENDED: [number, number] = [1.12, 1.4];
const CURLED: [number, number] = [1.12, 0.95];
/** Thumb tip → ring knuckle, / palm. L/Y/C 1.1–1.6; V/U/R/H/W/B tucked < 0.55. */
const THUMB_OUT: [number, number] = [0.75, 1.1];
const THUMB_IN: [number, number] = [0.75, 0.5];
/** Thumb tip → fingertip, / palm. */
const TOUCH: [number, number] = [0.45, 0.22];
/** Index/middle tip gap ÷ knuckle gap. V 1.8–2.6 vs U 0.8–1.2, R 0.3–0.75. */
const V_SPREAD: [number, number] = [1.4, 1.9];
/** Mean adjacent tip gap ÷ knuckle gap. Flat B 1.09–1.24. */
const PALM_SPREAD: [number, number] = [1.25, 1.7];
/** Knuckle→tip ÷ bone length. Straight B 0.99–1.00 vs curved C ≈ 0.92–0.97. */
const STRAIGHT: [number, number] = [0.96, 0.99];
/** O circle: thumb → index and middle tips, / palm. O ≤ 0.33. */
const O_CLOSED: [number, number] = [0.4, 0.22];
/** O vs fist: index tip → index knuckle, / palm. O 0.62–0.94; E/S/I < 0.47. */
const O_ROUND: [number, number] = [0.5, 0.7];
/** 10: thumb clear of the fingertips (rules out O). A ≥ 0.83, O ≤ 0.28. */
const THUMB_FREE: [number, number] = [0.55, 0.8];

const above = (value: number, [threshold]: [number, number]) => value > threshold;
const score = (value: number, [threshold, clearAt]: [number, number]) => clarity(value, threshold, clearAt);

export type ASLNumberResult = { value: number; confidence: number };

/**
 * Heuristic for the static one-hand ASL numbers 0–10, with a confidence that
 * rises as each feature moves further past its threshold (a textbook "3"
 * scores higher than one that barely qualifies).
 */
export function classifyASLNumberWithConfidence(points: Landmark[] | null): ASLNumberResult | null {
  if (!points || points.length < 21) return null;
  const wrist = points[0];
  const palm = distance(wrist, points[9]);
  if (palm < 1e-4) return null;
  const rel = (a: number, b: number) => distance(points[a], points[b]) / palm;

  const reach = FINGERS.map(({ tip, pip }) => {
    const pipDistance = distance(wrist, points[pip]);
    return pipDistance > 1e-6 ? distance(wrist, points[tip]) / pipDistance : 0;
  });
  const extended = reach.map((ratio) => above(ratio, EXTENDED));
  const fingerScore = (finger: number, wantUp: boolean) => score(reach[finger], wantUp ? EXTENDED : CURLED);
  const fingersScore = (up: number[], skip: number[] = []) =>
    [0, 1, 2, 3].filter((finger) => !skip.includes(finger)).map((finger) => fingerScore(finger, up.includes(finger)));

  // Thumb position measured against the ring knuckle: the thumb of a tucked
  // hand (2, 4, V, U, W) rests near it, a thumb held out (3, 5, 10, L) does not.
  const thumbAway = rel(4, 13);
  const thumbOut = above(thumbAway, THUMB_OUT);
  const touchRatio = FINGERS.map(({ tip }) => rel(4, tip));
  const thumbTouches = touchRatio.map((ratio) => ratio < TOUCH[0]);

  const gap = (a: number, b: number, ka: number, kb: number) => {
    const knuckles = distance(points[ka], points[kb]);
    return knuckles > 1e-6 ? distance(points[a], points[b]) / knuckles : 0;
  };
  const vSpread = gap(8, 12, 5, 9);
  const palmSpread = (gap(8, 12, 5, 9) + gap(12, 16, 9, 13) + gap(16, 20, 13, 17)) / 3;
  const straightness =
    FINGERS.reduce((sum, { mcp, tip }) => {
      const bones =
        distance(points[mcp], points[mcp + 1]) +
        distance(points[mcp + 1], points[mcp + 2]) +
        distance(points[mcp + 2], points[tip]);
      return sum + (bones > 1e-6 ? distance(points[mcp], points[tip]) / bones : 0);
    }, 0) / 4;

  const result = (value: number, clarities: number[]): ASLNumberResult => ({
    value,
    confidence: poseConfidence(clarities),
  });

  // 6–9: thumb touches the pinky, ring, middle, or index while the other three
  // fingers stay extended (6 is the W handshape, 9 the F handshape).
  for (let index = 3; index >= 0; index -= 1) {
    if (thumbTouches[index] && extended.every((isUp, finger) => finger === index || isUp)) {
      const others = [0, 1, 2, 3].filter((finger) => finger !== index);
      return result(6 + (3 - index), [
        ...others.map((finger) => fingerScore(finger, true)),
        score(touchRatio[index], TOUCH),
      ]);
    }
  }

  // 0: fingertips meet the thumb in a round O. The O must stay open, which
  // separates it from a closed fist (E, S) where the tips sit on the palm.
  const oClosed = Math.max(touchRatio[0], touchRatio[1]);
  const oRound = rel(8, 5);
  if (oClosed < O_CLOSED[0] && above(oRound, O_ROUND) && !extended[1] && !extended[2] && !extended[3]) {
    return result(0, [score(oClosed, O_CLOSED), score(oRound, O_ROUND)]);
  }

  const count = extended.filter(Boolean).length;

  // 4 and 5 need straight, spread fingers; a flat B (fingers together) or a
  // curved C is a different handshape, not a sloppy number.
  if (count === 4) {
    if (!above(palmSpread, PALM_SPREAD) || !above(straightness, STRAIGHT)) return null;
    const shape = [...fingersScore([0, 1, 2, 3]), score(palmSpread, PALM_SPREAD), score(straightness, STRAIGHT)];
    return thumbOut
      ? result(5, [...shape, score(thumbAway, THUMB_OUT)])
      : result(4, [...shape, score(thumbAway, THUMB_IN)]);
  }

  // 1: index only, thumb held over the curled fingers (as in D). A thumb held
  // out makes it L, or G when pointed sideways.
  if (count === 1 && extended[0]) {
    const thumbOnFingers = touchRatio[1] < TOUCH[0];
    if (thumbOut && !thumbOnFingers) return null;
    return result(1, [
      ...fingersScore([0]),
      thumbOnFingers ? score(touchRatio[1], TOUCH) : score(thumbAway, THUMB_IN),
    ]);
  }

  // 3: thumb, index and middle out; ring and pinky down.
  if (extended[0] && extended[1] && !extended[2] && !extended[3] && thumbOut) {
    return result(3, [...fingersScore([0, 1]), score(thumbAway, THUMB_OUT)]);
  }

  // 2: index and middle spread in a V, thumb tucked. Fingers held together
  // are U/H, crossed is R.
  if (count === 2 && extended[0] && extended[1]) {
    if (!above(vSpread, V_SPREAD)) return null;
    return result(2, [...fingersScore([0, 1]), score(vSpread, V_SPREAD), score(thumbAway, THUMB_IN)]);
  }

  // 10: fist with the thumb up and clear of the fingertips (A-hand, shaken in
  // signing). A tucked thumb (E, S) or one closing an O is not a 10.
  const thumbFree = touchRatio[1];
  if (count === 0 && thumbOut && above(thumbFree, THUMB_FREE)) {
    return result(10, [
      ...fingersScore([]),
      score(thumbAway, THUMB_OUT),
      score(thumbFree, THUMB_FREE),
    ]);
  }
  return null;
}

/** Number only, for callers that don't need the confidence. */
export function classifyASLNumber(points: Landmark[] | null): number | null {
  return classifyASLNumberWithConfidence(points)?.value ?? null;
}
