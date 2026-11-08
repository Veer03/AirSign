"use client";

import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import type { HandSide } from "@/lib/contracts";
import type { Landmark } from "./landmarks";

/** One hand as returned by MediaPipe for a single frame. */
export type RawHand = {
  side: HandSide;
  gesture: string;
  confidence: number;
  landmarks: Landmark[] | null;
};

export type RecognizerFrame = {
  hands: RawHand[];
};

/**
 * MediaPipe's handedness assumes a mirrored selfie image. Our <video> carries
 * unmirrored pixels (we only flip it with CSS), so swap the label for display.
 */
export function displaySide(category: string | null | undefined): HandSide {
  if (category === "Left") return "right";
  if (category === "Right") return "left";
  return "unknown";
}

let recognizerPromise: Promise<GestureRecognizer> | null = null;
let lastTimestamp = 0;

const MODEL_PATH = "/models/gesture_recognizer.task";
const WASM_PATH = "/mediapipe/wasm";

async function createRecognizer(): Promise<GestureRecognizer> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);

  const baseOptions = (delegate: "GPU" | "CPU") => ({
    baseOptions: {
      modelAssetPath: MODEL_PATH,
      delegate,
    },
    runningMode: "VIDEO" as const,
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  try {
    return await GestureRecognizer.createFromOptions(fileset, baseOptions("GPU"));
  } catch {
    // Older GPUs / some Linux drivers fail on the GPU delegate.
    return await GestureRecognizer.createFromOptions(fileset, baseOptions("CPU"));
  }
}

export function getRecognizer(): Promise<GestureRecognizer> {
  if (!recognizerPromise) {
    recognizerPromise = createRecognizer().catch((error) => {
      recognizerPromise = null;
      throw error;
    });
  }
  return recognizerPromise;
}

export function resetRecognizer() {
  recognizerPromise = null;
  lastTimestamp = 0;
}

/**
 * Runs one synchronous inference pass. MediaPipe requires strictly increasing
 * timestamps, so we guarantee that here.
 */
export function detect(
  recognizer: GestureRecognizer,
  video: HTMLVideoElement,
  timestampMs: number,
): RecognizerFrame {
  const timestamp = Math.max(timestampMs, lastTimestamp + 1);
  lastTimestamp = timestamp;

  const result = recognizer.recognizeForVideo(video, timestamp);
  const count = Math.max(result.landmarks?.length ?? 0, result.gestures?.length ?? 0);
  const hands: RawHand[] = [];

  for (let index = 0; index < count; index += 1) {
    const top = result.gestures?.[index]?.[0];
    const landmarks = result.landmarks?.[index];
    const category = result.handedness?.[index]?.[0]?.categoryName;

    hands.push({
      side: displaySide(category),
      gesture: top?.categoryName ?? "None",
      confidence: top?.score ?? 0,
      landmarks: landmarks
        ? landmarks.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 }))
        : null,
    });
  }

  return { hands };
}
