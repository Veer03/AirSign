"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { GestureState } from "@/lib/contracts";
import { clamp } from "@/lib/utils";
import { describeCameraError, startCamera, type CameraFacing } from "./camera";
import { detectHolistic, getHolistic, resetHolistic } from "./holistic";
import { frameHasHand, frameTo543, type FrameOptions, type Point3 } from "./holistic-frame";
import { getAslClassifier, type WordGuess } from "./asl-classifier";
import { HAND_CONNECTIONS } from "./landmarks";

/**
 * "ASL words" mode: MediaPipe Holistic + the Kaggle asl-signs classifier.
 *
 * Always recording: a sliding window of the last ~1.5 s is classified every
 * ~0.4 s while hands are visible. A word is added when it is confident AND the same
 * top-1 shows up in two inferences in a row; then the window is cleared.
 */

/** Top-1 probability needed (twice in a row) before a word is added. */
export const CONTINUOUS_THRESHOLD = 0.55;
const MIN_FRAMES = 8;
const MAX_FRAMES = 120;
const WINDOW_MS = 1500;
const INFER_EVERY_MS = 400;
const REPEAT_BLOCK_MS = 2500;
const HANDS_GONE_RESET_MS = 600;

export type AslRuntime = {
  state: GestureState;
  message: string;
  fps: number;
  delegate: "GPU" | "CPU" | null;
  handsVisible: number;
  /** Latest classification result (top 3). */
  guesses: WordGuess[] | null;
};

export type UseAslWordsOptions = {
  enabled: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onWord: (guess: WordGuess) => void;
  /** Front or rear camera. Raw frames are unmirrored either way, so the model input is unchanged. */
  facing?: CameraFacing;
};

type TimedFrame = { t: number; frame: Float32Array };

/** Debug toggles from the URL: ?mirror=1, ?swapHands=1 */
function readFrameOptions(): FrameOptions {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return { mirror: params.get("mirror") === "1", swapHands: params.get("swapHands") === "1" };
}

function drawHands(canvas: HTMLCanvasElement, video: HTMLVideoElement, hands: Point3[][], active: boolean) {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  const color = active ? "rgba(255, 122, 0, 0.95)" : "rgba(125, 211, 252, 0.95)";
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = clamp(width / 260, 2, 6);
  const dot = clamp(width / 190, 3, 9);

  for (const hand of hands) {
    for (const [from, to] of HAND_CONNECTIONS) {
      const a = hand[from];
      const b = hand[to];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    }
    for (const point of hand) {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Drop leading/trailing frames with no hand, keep at most the last MAX_FRAMES. */
function trimSegment(frames: Float32Array[]): Float32Array[] {
  let start = 0;
  let end = frames.length;
  while (start < end && !frameHasHand(frames[start])) start += 1;
  while (end > start && !frameHasHand(frames[end - 1])) end -= 1;
  const trimmed = frames.slice(start, end);
  return trimmed.length > MAX_FRAMES ? trimmed.slice(-MAX_FRAMES) : trimmed;
}

export function useAslWords({ enabled, videoRef, canvasRef, onWord, facing = "user" }: UseAslWordsOptions) {
  const [runtime, setRuntime] = useState<AslRuntime>({
    state: "idle",
    message: "Camera off",
    fps: 0,
    delegate: null,
    handsVisible: 0,
    guesses: null,
  });

  const busyRef = useRef(false);
  const onWordRef = useRef(onWord);

  // Sliding-window state, all in refs so the frame loop never re-renders.
  const windowRef = useRef<TimedFrame[]>([]);
  const lastInferRef = useRef(0);
  const lastHandAtRef = useRef(0);
  const candidateRef = useRef<string | null>(null);
  const lastEmitRef = useRef<{ gloss: string; at: number } | null>(null);

  useEffect(() => {
    onWordRef.current = onWord;
  }, [onWord]);

  const publish = useCallback((next: Partial<AslRuntime>) => {
    setRuntime((prev) => ({ ...prev, ...next }));
  }, []);

  const resetContinuous = useCallback(() => {
    windowRef.current = [];
    candidateRef.current = null;
  }, []);

  /** One continuous-mode inference over the current sliding window. */
  const inferContinuous = useCallback(async () => {
    const frames = trimSegment(windowRef.current.map((entry) => entry.frame));
    if (frames.length < MIN_FRAMES) return;

    busyRef.current = true;
    try {
      const classifier = await getAslClassifier();
      const guesses = await classifier.classify(frames);
      const top = guesses[0];
      const confident = Boolean(top) && top.probability >= CONTINUOUS_THRESHOLD;
      const stable = confident && candidateRef.current === top.gloss;
      candidateRef.current = confident ? top.gloss : null;

      const last = lastEmitRef.current;
      const repeat = Boolean(last && top && last.gloss === top.gloss && performance.now() - last.at < REPEAT_BLOCK_MS);

      if (stable && !repeat) {
        lastEmitRef.current = { gloss: top.gloss, at: performance.now() };
        resetContinuous(); // the next word starts from a clean window
        publish({ guesses, message: `Added “${top.gloss}”` });
        onWordRef.current(top);
      } else {
        publish({ guesses, message: confident ? `Hold on… “${top.gloss}”?` : "Watching…" });
      }
    } catch (error) {
      console.error("[asl] continuous classify failed", error);
    } finally {
      busyRef.current = false;
    }
  }, [publish, resetContinuous]);

  useEffect(() => {
    if (!enabled) {
      windowRef.current = [];
      publish({ state: "idle", message: "Camera off", fps: 0, handsVisible: 0, guesses: null });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let cancelled = false;
    let frameHandle: number | null = null;
    let usingVideoFrame = false;
    let stopCamera: (() => void) | null = null;
    let frames = 0;
    let fpsWindowStart = performance.now();
    let lastUi = 0;
    const frameOptions = readFrameOptions();

    const schedule = (tick: (now: number) => void) => {
      if (cancelled) return;
      const withVfc = video as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: (now: number) => void) => number;
      };
      if (typeof withVfc.requestVideoFrameCallback === "function") {
        usingVideoFrame = true;
        frameHandle = withVfc.requestVideoFrameCallback(tick);
      } else {
        usingVideoFrame = false;
        frameHandle = requestAnimationFrame(tick);
      }
    };

    const start = async () => {
      publish({ state: "starting", message: "Requesting camera…" });
      let handle: Awaited<ReturnType<typeof startCamera>>;
      try {
        // Holistic downsamples anyway; 640x480 keeps the frame upload cheap.
        handle = await startCamera(video, () => cancelled, { width: 640, height: 480 }, facing);
      } catch (error) {
        if (cancelled) return;
        const described = describeCameraError(error);
        publish({ state: described.kind === "denied" ? "denied" : "error", message: described.message });
        return;
      }
      if (cancelled) {
        handle.stop();
        return;
      }
      stopCamera = handle.stop;
      publish({ state: "starting", message: "Loading sign-word models…" });

      let holistic: Awaited<ReturnType<typeof getHolistic>>;
      try {
        // Warm the classifier in parallel so the first sign is not slow.
        const [h] = await Promise.all([getHolistic(), getAslClassifier()]);
        holistic = h;
      } catch (error) {
        if (cancelled) return;
        console.error("[asl] model load failed", error);
        publish({
          state: "error",
          message: "Sign-word models are missing or failed to load. Run `npm run setup:assets`, then reload.",
        });
        resetHolistic();
        return;
      }
      if (cancelled) return;
      console.info("[asl] holistic delegate:", holistic.delegate, frameOptions);
      publish({
        state: "ready",
        delegate: holistic.delegate,
        message: "Sign words one after another",
      });

      const tick = (now: number) => {
        if (cancelled) return;
        if (video.readyState >= 2 && video.videoWidth > 0) {
          try {
            const result = detectHolistic(holistic.landmarker, video, now);
            const hands = [result.leftHandLandmarks?.[0], result.rightHandLandmarks?.[0]].filter(
              (hand): hand is NonNullable<typeof hand> => Boolean(hand && hand.length),
            );
            if (hands.length) lastHandAtRef.current = now;

            if (hands.length === 0 && now - lastHandAtRef.current > HANDS_GONE_RESET_MS) {
              // Hands down: forget the half-seen sign so it can't leak into the next one.
              if (windowRef.current.length) resetContinuous();
            } else {
              const win = windowRef.current;
              win.push({ t: now, frame: frameTo543(result, frameOptions) });
              while (win.length && (now - win[0].t > WINDOW_MS || win.length > MAX_FRAMES)) win.shift();
              if (!busyRef.current && now - lastInferRef.current >= INFER_EVERY_MS) {
                lastInferRef.current = now;
                void inferContinuous();
              }
            }

            drawHands(canvas, video, hands, hands.length > 0);

            frames += 1;
            if (now - fpsWindowStart >= 1000) {
              publish({ fps: Math.round((frames * 1000) / (now - fpsWindowStart)) });
              frames = 0;
              fpsWindowStart = now;
            }
            if (now - lastUi > 150) {
              lastUi = now;
              publish({ handsVisible: hands.length });
            }
          } catch {
            // A single bad frame should never kill the loop.
          }
        }
        schedule(tick);
      };
      schedule(tick);
    };

    void start();

    return () => {
      cancelled = true;
      if (frameHandle !== null) {
        if (usingVideoFrame) {
          (video as HTMLVideoElement & { cancelVideoFrameCallback?: (id: number) => void }).cancelVideoFrameCallback?.(
            frameHandle,
          );
        } else {
          cancelAnimationFrame(frameHandle);
        }
      }
      stopCamera?.();
      windowRef.current = [];
    };
    // facing: switching front/rear restarts the camera in place.
  }, [enabled, facing, publish, videoRef, canvasRef, inferContinuous, resetContinuous]);

  return { runtime };
}
