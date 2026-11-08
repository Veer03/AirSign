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

  // The pictured OK pose joins thumb and index while the other three fingers
  // stay raised. Map that shape to the spoken interjection in gesture mode.
  const palmLength = dist2d(wrist, landmarks[9]);
  const pinch = palmLength > 1e-6 ? dist2d(landmarks[4], landmarks[8]) / palmLength : 1;
  const wowPose = pinch < 0.65 && middle > 1.1 && ring > 1.1 && pinky > 1.1;
  if (wowPose) return { gesture: "Wow", confidence: 0.9 };

  // A Korean finger heart pinches the index fingertip against the thumb while
  // the other three fingers stay curled. Normalize the pinch to palm length
  // so it works at different camera distances.
  // The index is usually bent while forming the heart, so do not require a
  // fully extended finger. The pinch and three curled fingers distinguish it
  // from an open pinch or a closed fist across either hand orientation.
  const indexOutFromPalm = index > 0.9;
  const otherFingersCurled = middle < 1.2 && ring < 1.2 && pinky < 1.2;
  if (pinch < 0.75 && indexOutFromPalm && otherFingersCurled) {
    return { gesture: "Finger_Heart", confidence: 0.9 };
  }

  // A finger gun extends the index and thumb while the middle, ring, and pinky
  // stay curled. Keep the thumb away from the index tip so it does not collide
  // with the finger-heart pinch, and require clear thumb extension from the
  // wrist/palm to separate it from a plain pointing pose.
  const indexExtended = index > 1.2;
  const thumbExtended = dist2d(wrist, landmarks[4]) / Math.max(palmLength, 1e-6) > 0.95;
  if (indexExtended && thumbExtended && pinch > 0.55 && middle < 1.05 && ring < 1.05 && pinky < 1.05) {
    return { gesture: "Gun", confidence: 0.9 };
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
