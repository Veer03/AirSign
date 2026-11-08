import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export const LANDMARKS_PER_HAND = 21;
export const VALUES_PER_HAND = LANDMARKS_PER_HAND * 3;
export const MAX_HANDS = 2;
export const VALUES_PER_FRAME = VALUES_PER_HAND * MAX_HANDS;

/** Translate a hand to its wrist, scale it, and flatten 21 x/y/z points. */
export function normalizeLandmarks(
  landmarks: NormalizedLandmark[],
  handedness?: string,
): number[] | null {
  if (landmarks.length < LANDMARKS_PER_HAND) return null;
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const scale = Math.hypot(
    middleMcp.x - wrist.x,
    middleMcp.y - wrist.y,
    middleMcp.z - wrist.z,
  );
  if (!Number.isFinite(scale) || scale < 1e-6) return null;

  const mirror = handedness?.toLowerCase() === "left" ? -1 : 1;
  const result: number[] = [];
  for (const landmark of landmarks.slice(0, LANDMARKS_PER_HAND)) {
    const values = [
      ((landmark.x - wrist.x) / scale) * mirror,
      (landmark.y - wrist.y) / scale,
      (landmark.z - wrist.z) / scale,
    ];
    if (values.some((value) => !Number.isFinite(value))) return null;
    result.push(...values.map((value) => Number(value.toFixed(4))));
  }
  return result;
}

/** Fixed 126-value frame vector; right hand occupies slot 0, left hand slot 1. */
export function normalizeHandFrame(
  landmarks: NormalizedLandmark[][],
  handedness: string[],
): number[] {
  const slots = [Array<number>(VALUES_PER_HAND).fill(0), Array<number>(VALUES_PER_HAND).fill(0)];
  landmarks.forEach((hand, index) => {
    const label = handedness[index]?.toLowerCase();
    const slot = label === "left" ? 1 : 0;
    const normalized = normalizeLandmarks(hand, label);
    if (normalized) slots[slot] = normalized;
  });
  return slots.flat();
}
