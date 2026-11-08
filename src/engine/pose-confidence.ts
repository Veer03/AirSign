/**
 * Graded confidence for rule-based handshapes.
 *
 * A rule like "finger extended when ratio > 1.12" is pass/fail, so a hand that
 * barely passes used to score the same as a textbook one. `clarity` measures
 * how far past the threshold a measurement is: 0 at the threshold, 1 once it
 * reaches `clearAt`. Works in either direction (clearAt below threshold means
 * "smaller is better").
 */
export function clarity(value: number, threshold: number, clearAt: number): number {
  const span = clearAt - threshold;
  if (span === 0) return value >= threshold ? 1 : 0;
  return Math.min(1, Math.max(0, (value - threshold) / span));
}

/** Lowest score a recognised pose reports; stays above the 0.5 lock gate. */
export const POSE_FLOOR = 0.6;
export const POSE_CEILING = 0.99;

/**
 * Combines per-feature clarities into a confidence in [POSE_FLOOR, POSE_CEILING].
 * Half weight on the weakest feature, so one sloppy finger holds the score
 * back even when everything else is perfect.
 */
export function poseConfidence(clarities: number[]): number {
  if (clarities.length === 0) return POSE_FLOOR;
  const min = Math.min(...clarities);
  const mean = clarities.reduce((sum, value) => sum + value, 0) / clarities.length;
  const quality = 0.5 * min + 0.5 * mean;
  return POSE_FLOOR + (POSE_CEILING - POSE_FLOOR) * quality;
}
