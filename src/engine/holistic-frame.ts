/**
 * Builds one frame in the Kaggle "asl-signs" layout from a MediaPipe Holistic
 * result: 543 points x (x, y, z), normalized image coordinates.
 *
 *   face        0–467   (Tasks may return 478 with iris; extras are dropped)
 *   left_hand 468–488
 *   pose      489–521
 *   right_hand 522–542
 *
 * Any part that was not detected is NaN, exactly like the dataset parquet
 * files. The model does its own preprocessing on top of this.
 */

export const FACE_POINTS = 468;
export const HAND_POINTS = 21;
export const POSE_POINTS = 33;
export const FRAME_POINTS = FACE_POINTS + HAND_POINTS + POSE_POINTS + HAND_POINTS; // 543
export const FRAME_VALUES = FRAME_POINTS * 3; // 1629

const FACE_START = 0;
const LEFT_START = FACE_POINTS;
const POSE_START = LEFT_START + HAND_POINTS;
const RIGHT_START = POSE_START + POSE_POINTS;

export type Point3 = { x: number; y: number; z?: number };

/** The subset of HolisticLandmarkerResult we read. */
export type HolisticLike = {
  faceLandmarks?: Point3[][];
  leftHandLandmarks?: Point3[][];
  poseLandmarks?: Point3[][];
  rightHandLandmarks?: Point3[][];
};

export type FrameOptions = {
  /** Debug: x = 1 - x on every point, and swap the hand blocks. */
  mirror?: boolean;
  /** Debug: swap left/right hand blocks only. Combined with mirror it cancels the swap. */
  swapHands?: boolean;
};

function writePart(
  out: Float32Array,
  start: number,
  count: number,
  points: Point3[] | undefined,
  mirror: boolean,
) {
  if (!points || points.length < count) return; // stays NaN
  for (let i = 0; i < count; i += 1) {
    const p = points[i];
    const o = (start + i) * 3;
    out[o] = mirror ? 1 - p.x : p.x;
    out[o + 1] = p.y;
    out[o + 2] = p.z ?? 0;
  }
}

export function frameTo543(result: HolisticLike, options: FrameOptions = {}): Float32Array {
  const mirror = Boolean(options.mirror);
  const swap = mirror !== Boolean(options.swapHands);
  const out = new Float32Array(FRAME_VALUES).fill(Number.NaN);

  const left = result.leftHandLandmarks?.[0];
  const right = result.rightHandLandmarks?.[0];

  writePart(out, FACE_START, FACE_POINTS, result.faceLandmarks?.[0], mirror);
  writePart(out, LEFT_START, HAND_POINTS, swap ? right : left, mirror);
  writePart(out, POSE_START, POSE_POINTS, result.poseLandmarks?.[0], mirror);
  writePart(out, RIGHT_START, HAND_POINTS, swap ? left : right, mirror);

  return out;
}

/** True when at least one hand is present in a 543-frame. */
export function frameHasHand(frame: Float32Array): boolean {
  return !Number.isNaN(frame[LEFT_START * 3]) || !Number.isNaN(frame[RIGHT_START * 3]);
}

/** Concatenate frames into one [T * 543 * 3] buffer for the model. */
export function stackFrames(frames: Float32Array[]): Float32Array {
  const out = new Float32Array(frames.length * FRAME_VALUES);
  frames.forEach((frame, index) => out.set(frame, index * FRAME_VALUES));
  return out;
}
