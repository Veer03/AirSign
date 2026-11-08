import type { GestureId } from "@/lib/contracts";
import type { Landmark } from "./landmarks";

export type CustomGesture = {
  gesture: GestureId;
  confidence: number;
};

const dist2d = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

/** Derives custom handshapes from MediaPipe's 21 hand landmarks. */
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

  // A Korean finger heart pinches the index fingertip against the thumb while
  // the other three fingers stay curled. Normalize the pinch to palm length
  // so it works at different camera distances.
  const palmLength = dist2d(wrist, landmarks[9]);
  const pinch = palmLength > 1e-6 ? dist2d(landmarks[4], landmarks[8]) / palmLength : 1;
  const indexExtended = index > 1.05;
  const otherFingersCurled = middle < 1.05 && ring < 1.05 && pinky < 1.05;
  if (pinch < 0.55 && indexExtended && otherFingersCurled) {
    return { gesture: "Finger_Heart", confidence: 0.9 };
  }

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
