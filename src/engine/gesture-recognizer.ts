import type {
  GestureRecognizer,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";

export type { GestureRecognizerResult };

export async function createGestureRecognizer(): Promise<GestureRecognizer> {
  const { FilesetResolver, GestureRecognizer: GestureRecognizerTask } = await import(
    "@mediapipe/tasks-vision"
  );
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  return GestureRecognizerTask.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/models/gesture_recognizer.task" },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    cannedGesturesClassifierOptions: { scoreThreshold: 0.55 },
  });
}
