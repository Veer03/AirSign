import type { RawHand } from "./recognizer";
import type { Landmark } from "./landmarks";

export type TrackedHand = RawHand & { id: string };

type Track = {
  id: string;
  cx: number;
  cy: number;
  lastSeen: number;
  landmarks: Landmark[] | null;
};

function smoothLandmarks(
  previous: Landmark[] | null,
  current: Landmark[] | null,
): Landmark[] | null {
  if (!current || current.length === 0) return current;
  if (!previous || previous.length !== current.length) return current;

  const wrist = current[0];
  const previousWrist = previous[0];
  const wristMotion = Math.hypot(wrist.x - previousWrist.x, wrist.y - previousWrist.y);
  // Smooth small tracking jitter while following quick hand movement closely.
  const response = wristMotion > 0.025 ? 0.88 : 0.68;

  return current.map((point, index) => {
    const before = previous[index];
    return {
      x: before.x + (point.x - before.x) * response,
      y: before.y + (point.y - before.y) * response,
      z: before.z + (point.z - before.z) * response,
    };
  });
}

function centroid(landmarks: Landmark[] | null): { x: number; y: number } {
  if (!landmarks || landmarks.length === 0) return { x: 0.5, y: 0.5 };

  let x = 0;
  let y = 0;
  for (const point of landmarks) {
    x += point.x;
    y += point.y;
  }
  return { x: x / landmarks.length, y: y / landmarks.length };
}

/**
 * MediaPipe reorders hands between frames and its handedness can flip.
 * Matching by palm centroid keeps a stable id so dwell timers never reset
 * just because hand 0 and hand 1 swapped places.
 */
export class HandTracker {
  private tracks: Track[] = [];
  private nextId = 1;

  constructor(
    private readonly maxDistance = 0.3,
    private readonly ttlMs = 400,
  ) {}

  reset() {
    this.tracks = [];
  }

  update(hands: RawHand[], now: number): TrackedHand[] {
    this.tracks = this.tracks.filter((track) => now - track.lastSeen <= this.ttlMs);

    const used = new Set<string>();
    const tracked: TrackedHand[] = [];

    for (const hand of hands) {
      const centre = centroid(hand.landmarks);

      let best: Track | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const track of this.tracks) {
        if (used.has(track.id)) continue;
        const distance = Math.hypot(track.cx - centre.x, track.cy - centre.y);
        if (distance < bestDistance && distance <= this.maxDistance) {
          best = track;
          bestDistance = distance;
        }
      }

      if (!best) {
        best = {
          id: `h${this.nextId++}`,
          cx: centre.x,
          cy: centre.y,
          lastSeen: now,
          landmarks: hand.landmarks,
        };
        this.tracks.push(best);
      }

      const smoothedLandmarks = smoothLandmarks(best.landmarks, hand.landmarks);
      best.cx = centre.x;
      best.cy = centre.y;
      best.lastSeen = now;
      best.landmarks = smoothedLandmarks;
      used.add(best.id);

      tracked.push({ ...hand, landmarks: smoothedLandmarks, id: best.id });
    }

    return tracked;
  }
}
