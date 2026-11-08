import type { RawHand } from "./recognizer";
import type { Landmark } from "./landmarks";

export type TrackedHand = RawHand & { id: string };

type Track = { id: string; cx: number; cy: number; lastSeen: number };

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
        best = { id: `h${this.nextId++}`, cx: centre.x, cy: centre.y, lastSeen: now };
        this.tracks.push(best);
      }

      best.cx = centre.x;
      best.cy = centre.y;
      best.lastSeen = now;
      used.add(best.id);

      tracked.push({ ...hand, id: best.id });
    }

    return tracked;
  }
}
