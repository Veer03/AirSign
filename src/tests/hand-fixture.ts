import type { Landmark } from "../engine/landmarks";

/**
 * Hand pointing up. `reach` per finger is tip height above the pip: positive
 * extends the finger, negative curls it. Thumb tip placed at `thumb`. `fan`
 * spreads the fingertips apart (1 = parallel fingers).
 */
export function hand(
  reach: [number, number, number, number],
  thumb: { x: number; y: number },
  fan = 1,
): Landmark[] {
  const points: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.9, z: 0 }));
  const xs = [0.46, 0.5, 0.54, 0.58];
  [5, 9, 13, 17].forEach((mcp, finger) => {
    const x = xs[finger];
    const up = Math.max(0, reach[finger]);
    const fanned = (height: number) => x + (x - 0.52) * (fan - 1) * (height / 0.2);
    points[mcp] = { x, y: 0.7, z: 0 };
    points[mcp + 1] = { x, y: 0.6, z: 0 };
    points[mcp + 2] = { x: fanned(up / 2), y: 0.6 - reach[finger] / 2, z: 0 };
    points[mcp + 3] = { x: fanned(up), y: 0.6 - reach[finger], z: 0 };
  });
  points[4] = { x: thumb.x, y: thumb.y, z: 0 };
  return points;
}
