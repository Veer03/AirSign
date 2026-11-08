"use client";

import { FilesetResolver, HolisticLandmarker } from "@mediapipe/tasks-vision";
import type { HolisticLandmarkerResult } from "@mediapipe/tasks-vision";

import { preferredDelegates, quietMediaPipeLogs, type Delegate } from "./delegate";

export type HolisticHandle = { landmarker: HolisticLandmarker; delegate: Delegate };

const MODEL_PATH = "/models/holistic_landmarker.task";
const WASM_PATH = "/mediapipe/wasm";

let holisticPromise: Promise<HolisticHandle> | null = null;
let lastTimestamp = 0;

async function createHolistic(): Promise<HolisticHandle> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  const options = (delegate: "GPU" | "CPU") => ({
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: "VIDEO" as const,
    outputFaceBlendshapes: false,
    outputPoseSegmentationMasks: false,
  });

  quietMediaPipeLogs();
  let lastError: unknown;
  for (const delegate of preferredDelegates()) {
    try {
      return { landmarker: await HolisticLandmarker.createFromOptions(fileset, options(delegate)), delegate };
    } catch (error) {
      lastError = error;
      console.warn(`[asl] Holistic ${delegate} delegate failed`, error);
    }
  }
  throw lastError;
}

export function getHolistic(): Promise<HolisticHandle> {
  if (!holisticPromise) {
    holisticPromise = createHolistic().catch((error) => {
      holisticPromise = null;
      throw error;
    });
  }
  return holisticPromise;
}

export function resetHolistic() {
  holisticPromise = null;
  lastTimestamp = 0;
}

/** Close the current landmarker so the next getHolistic() rebuilds it (e.g. new delegate). */
export function disposeHolistic() {
  const pending = holisticPromise;
  resetHolistic();
  void pending?.then((handle) => handle.landmarker.close()).catch(() => {});
}

/** MediaPipe needs strictly increasing timestamps. */
export function detectHolistic(
  landmarker: HolisticLandmarker,
  video: HTMLVideoElement,
  timestampMs: number,
): HolisticLandmarkerResult {
  const timestamp = Math.max(timestampMs, lastTimestamp + 1);
  lastTimestamp = timestamp;
  return landmarker.detectForVideo(video, timestamp);
}
