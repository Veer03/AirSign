import type { GestureId } from "@/lib/contracts";
import type { Landmark } from "./landmarks";
import { clarity, poseConfidence } from "./pose-confidence";

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
  if (wowPose) {
    return {
      gesture: "Wow",
      confidence: poseConfidence([
        clarity(pinch, 0.65, 0.3),
        clarity(middle, 1.1, 1.4),
        clarity(ring, 1.1, 1.4),
        clarity(pinky, 1.1, 1.4),
      ]),
    };
  }

  // A Korean finger heart pinches the index fingertip against the thumb while
  // the other three fingers stay curled. Normalize the pinch to palm length
  // so it works at different camera distances.
  // The index is usually bent while forming the heart, so do not require a
  // fully extended finger. The pinch and three curled fingers distinguish it
  // from an open pinch or a closed fist across either hand orientation.
  const indexOutFromPalm = index > 0.9;
  const otherFingersCurled = middle < 1.2 && ring < 1.2 && pinky < 1.2;
  // Require a clear thumb/index pinch. The old 0.75 palm-length threshold
  // also accepted loose poses where the fingertips were visibly apart.
  const fingerHeartPinch = 0.45;
  if (pinch < fingerHeartPinch && indexOutFromPalm && otherFingersCurled) {
    return {
      gesture: "Finger_Heart",
      confidence: poseConfidence([
        clarity(pinch, fingerHeartPinch, 0.3),
        clarity(index, 0.9, 1.1),
        clarity(middle, 1.2, 0.95),
        clarity(ring, 1.2, 0.95),
        clarity(pinky, 1.2, 0.95),
      ]),
    };
  }

  const middleExtended = middle > 1.2;
  const othersCurled = index < 1.05 && ring < 1.05 && pinky < 1.05;
  if (!middleExtended || !othersCurled) return null;

  // Guard against a sloppy victory/point where another fingertip is actually
  // farther from the wrist than the middle one.
  const middleTip = dist2d(wrist, landmarks[12]);
  const lead = Math.min(
    ...[8, 16, 20].map((tip) => {
      const other = dist2d(wrist, landmarks[tip]);
      return other > 1e-6 ? middleTip / other : Infinity;
    }),
  );

  if (!(lead > 1.1)) return null;

  return {
    gesture: "Middle_Finger",
    confidence: poseConfidence([
      clarity(middle, 1.2, 1.5),
      clarity(index, 1.05, 0.9),
      clarity(ring, 1.05, 0.9),
      clarity(pinky, 1.05, 0.9),
      clarity(lead, 1.1, 1.35),
    ]),
  };
}
