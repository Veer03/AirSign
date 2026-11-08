import type { RawHand } from "./recognizer";
import type { Landmark } from "./landmarks";

export type TrackedHand = RawHand & { id: string };

/**
 * One Euro filter settings (Casiez et al. 2012), the standard filter for
 * landmark jitter. Cutoff rises with speed: a still hand gets heavy smoothing
 * (no shimmer), a moving hand gets almost none (no lag). Speed is measured in
 * palm lengths per second, so it behaves the same near or far from the camera.
 *
 * At 30 fps: still ≈ 2.5 Hz (α≈0.34), 1 palm/s ≈ 6.5 Hz (α≈0.57),
 * 3 palm/s ≈ 16.5 Hz (α≈0.78).
 */
const MIN_CUTOFF_HZ = 1.5;
const BETA = 5;
const DERIVATIVE_CUTOFF_HZ = 1;
const FALLBACK_DT = 1 / 30;

type Track = {
  id: string;
  cx: number;
  cy: number;
  lastSeen: number;
  landmarks: Landmark[] | null;
  /** Filtered speed per landmark, palm lengths per second. */
  speeds: Float32Array | null;
};

const smoothingFactor = (dt: number, cutoffHz: number) => {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dt);
};

function palmLength(points: Landmark[]): number {
  if (points.length < 10) return 0.15;
  return Math.hypot(points[9].x - points[0].x, points[9].y - points[0].y) || 0.15;
}

/** Filters one frame in place on the track; returns the smoothed landmarks. */
function filterLandmarks(track: Track, current: Landmark[] | null, dtSeconds: number): Landmark[] | null {
  const previous = track.landmarks;
  if (!current || current.length === 0) return current;
  if (!previous || previous.length !== current.length) {
    track.speeds = new Float32Array(current.length);
    return current;
  }

  const dt = dtSeconds > 0 && dtSeconds < 0.5 ? dtSeconds : FALLBACK_DT;
  const scale = palmLength(current);
  const speeds = track.speeds && track.speeds.length === current.length
    ? track.speeds
    : new Float32Array(current.length);
  const derivativeAlpha = smoothingFactor(dt, DERIVATIVE_CUTOFF_HZ);

  const smoothed = new Array<Landmark>(current.length);
  for (let index = 0; index < current.length; index += 1) {
    const point = current[index];
    const before = previous[index];
    const rawSpeed = Math.hypot(point.x - before.x, point.y - before.y) / scale / dt;
    const speed = speeds[index] + derivativeAlpha * (rawSpeed - speeds[index]);
    speeds[index] = speed;

    const alpha = smoothingFactor(dt, MIN_CUTOFF_HZ + BETA * speed);
    smoothed[index] = {
      x: before.x + alpha * (point.x - before.x),
      y: before.y + alpha * (point.y - before.y),
      z: before.z + alpha * (point.z - before.z),
    };
  }
  track.speeds = speeds;
  return smoothed;
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

      let dtSeconds = 0;
      if (!best) {
        best = {
          id: `h${this.nextId++}`,
          cx: centre.x,
          cy: centre.y,
          lastSeen: now,
          landmarks: null,
          speeds: null,
        };
        this.tracks.push(best);
      } else {
        dtSeconds = (now - best.lastSeen) / 1000;
      }

      const smoothedLandmarks = filterLandmarks(best, hand.landmarks, dtSeconds);
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
