import type { Landmark } from "./landmarks";

const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const FINGERS = [
  { tip: 8, pip: 6, mcp: 5 },
  { tip: 12, pip: 10, mcp: 9 },
  { tip: 16, pip: 14, mcp: 13 },
  { tip: 20, pip: 18, mcp: 17 },
] as const;

/** Heuristic for the static one-hand ASL number shapes shown in the practice chart. */
export function classifyASLNumber(points: Landmark[] | null): number | null {
  if (!points || points.length < 21) return null;
  const wrist = points[0];
  const palm = distance(wrist, points[9]);
  if (palm < 1e-4) return null;

  const extended = FINGERS.map(({ tip, pip }) =>
    distance(wrist, points[tip]) > distance(wrist, points[pip]) * 1.12,
  );
  // ASL 3 holds the thumb out while the index and middle fingers are raised.
  // The thumb may point sideways or upward, so wrist-to-tip extension alone
  // is too strict; use its separation from the palm instead.
  const thumbExtended = distance(points[4], points[5]) > palm * 0.45;
  const thumbTouches = FINGERS.map(({ tip }) => distance(points[4], points[tip]) / palm < 0.45);

  // ASL 6–9 touch the thumb to the pinky, ring, middle, or index finger while
  // keeping the remaining three fingers extended.
  for (let index = 3; index >= 0; index -= 1) {
    if (thumbTouches[index] && extended.every((isUp, finger) => finger === index || isUp)) {
      return 6 + (3 - index);
    }
  }

  const count = extended.filter(Boolean).length;
  if (count === 4 && !thumbExtended) return 4;
  if (count === 4 && thumbExtended) return 5;
  if (count === 1 && extended[0]) return 1;
  if (extended[0] && extended[1] && thumbExtended && !extended[3]) return 3;
  if (count === 2 && extended[0] && extended[1]) return 2;
  if (count === 0 && thumbExtended) return 10;
  return null;
}
