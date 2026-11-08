import type { GestureId } from "@/lib/contracts";
import type { Landmark } from "./landmarks";

export type CustomGesture = {
  gesture: GestureId;
  confidence: number;
};

const dist2d = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * MediaPipe's built-in handshapes do not include a middle finger, so we derive
 * it from the 21 landmarks: the middle finger is extended while the index,
 * ring, and pinky are curled. Thumb position is ignored so the sign works with
 * the thumb tucked or resting on the folded fingers.
 *
 * The ratio is orientation-invariant: an extended fingertip sits farther from
 * the wrist than its PIP joint, while a curled fingertip folds back toward it.
 */
export function detectCustomGesture(
  landmarks: Landmark[] | null | undefined,
): CustomGesture | null {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const reach = (tip: number, pip: number) => {
    const pipDistance = dist2d(wrist, landmarks[pip]);
    if (pipDistance < 1e-6) return 0;
    return dist2d(wrist, landmarks[tip]) / pipDistance;
  };

  const middle = reach(12, 10);
  const index = reach(8, 6);
  const ring = reach(16, 14);
  const pinky = reach(20, 18);

  const middleExtended = middle > 1.2;
  const othersCurled = index < 1.05 && ring < 1.05 && pinky < 1.05;
  if (!middleExtended || !othersCurled) return null;

  // Guard against a sloppy victory/point where another fingertip is actually
  // farther from the wrist than the middle one.
  const middleTip = dist2d(wrist, landmarks[12]);
  const longest =
    middleTip > dist2d(wrist, landmarks[8]) * 1.1 &&
    middleTip > dist2d(wrist, landmarks[16]) * 1.1 &&
    middleTip > dist2d(wrist, landmarks[20]) * 1.1;

  if (!longest) return null;

  return { gesture: "Middle_Finger", confidence: 0.9 };
}
