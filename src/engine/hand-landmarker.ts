import type { HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

export type { HandLandmarkerResult };

export async function createHandLandmarker(): Promise<HandLandmarker> {
  const { FilesetResolver, HandLandmarker: HandLandmarkerTask } = await import(
    "@mediapipe/tasks-vision"
  );
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  return HandLandmarkerTask.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/models/hand_landmarker.task" },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}
