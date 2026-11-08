"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { GestureState } from "@/lib/contracts";
import { clamp } from "@/lib/utils";
import { describeCameraError, startCamera, type CameraFacing } from "./camera";
import { detectHolistic, disposeHolistic, getHolistic } from "./holistic";
import { frameHasHand, frameTo543, type FrameOptions, type Point3 } from "./holistic-frame";
import { getAslClassifier, type WordGuess } from "./asl-classifier";
import { HAND_CONNECTIONS } from "./landmarks";

/**
 * "ASL words" mode: MediaPipe Holistic + the Kaggle asl-signs classifier.
 *
 * Always recording: a sliding window of the last ~1.5 s is classified every
 * ~0.25 s while hands are visible. A word is added when it appears in the top
 * two across multiple recent inferences, including at least one top-1 result;
 * then the window is cleared.
 */

/** Evidence floor: require both repeated support and at least one clear-ish hit. */
const MIN_SUPPORT_AVERAGE = 0.22;
const MIN_SUPPORT_PEAK = 0.28;
const MIN_FRAMES = 6;
const MAX_FRAMES = 120;
const WINDOW_MS = 1500;
const INFER_EVERY_MS = 250;
const EVIDENCE_COUNT = 3;
const REPEAT_BLOCK_MS = 2500;
const HANDS_GONE_RESET_MS = 600;
const SMOOTH_WEIGHTS = [0.2, 0.3, 0.5];

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
type CandidateEvidence = { guesses: WordGuess[] };

function smoothGuesses(history: WordGuess[][]): WordGuess[] {
  const weights = SMOOTH_WEIGHTS.slice(SMOOTH_WEIGHTS.length - history.length);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const scores = new Map<string, number>();

  history.forEach((guesses, historyIndex) => {
    const weight = weights[historyIndex];
    for (const guess of guesses) {
      scores.set(guess.gloss, (scores.get(guess.gloss) ?? 0) + guess.probability * weight);
    }
  });

  return [...scores]
    .map(([gloss, score]) => ({ gloss, probability: score / totalWeight }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
}

function confirmCandidate(evidence: CandidateEvidence[]) {
  const counts = new Map<string, { count: number; topCount: number; totalProbability: number; peak: number; lastIndex: number }>();
  evidence.forEach(({ guesses }, index) => {
    // A genuine sign can move between rank 1 and 2 as the signer forms it.
    // Count only the top two, and keep the one-frame peak as an anti-noise check.
    guesses.slice(0, 2).forEach((guess, rank) => {
      const current = counts.get(guess.gloss) ?? {
        count: 0,
        topCount: 0,
        totalProbability: 0,
        peak: 0,
        lastIndex: -1,
      };
      current.count += 1;
      if (rank === 0) current.topCount += 1;
      current.totalProbability += guess.probability;
      current.peak = Math.max(current.peak, guess.probability);
      current.lastIndex = index;
      counts.set(guess.gloss, current);
    });
  });

  const winner = [...counts.entries()]
    .filter(([, result]) => {
      const average = result.totalProbability / result.count;
      return result.count >= 2 && result.topCount >= 1 &&
        average >= MIN_SUPPORT_AVERAGE && result.peak >= MIN_SUPPORT_PEAK;
    })
    .sort((a, b) =>
      b[1].count - a[1].count ||
      b[1].topCount - a[1].topCount ||
      b[1].totalProbability / b[1].count - a[1].totalProbability / a[1].count ||
      b[1].lastIndex - a[1].lastIndex,
    )[0];
  if (!winner) return null;
  const [gloss, result] = winner;
  return {
    gloss,
    probability: result.totalProbability / result.count,
  } satisfies WordGuess;
}

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
    ctx.beginPath();
    for (const [from, to] of HAND_CONNECTIONS) {
      const a = hand[from];
      const b = hand[to];
      if (!a || !b) continue;
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
    }
    ctx.stroke();
    ctx.beginPath();
    for (const point of hand) {
      // Start a separate subpath so fill() keeps the landmarks as dots.
      ctx.moveTo(point.x * width + dot, point.y * height);
      ctx.arc(point.x * width, point.y * height, dot, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
}

function smoothOverlayHand(previous: Point3[] | null, current: Point3[] | null): Point3[] | null {
  if (!current || current.length === 0) return current;
  if (!previous || previous.length !== current.length) return current;

  const movement = Math.hypot(current[0].x - previous[0].x, current[0].y - previous[0].y);
  const response = movement > 0.025 ? 0.9 : 0.76;
  return current.map((point, index) => {
    const before = previous[index];
    return {
      x: before.x + (point.x - before.x) * response,
      y: before.y + (point.y - before.y) * response,
      z: (before.z ?? 0) + ((point.z ?? 0) - (before.z ?? 0)) * response,
    };
  });
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
  const sessionRef = useRef(0);
  const overlayHandsRef = useRef<{ left: Point3[] | null; right: Point3[] | null }>({ left: null, right: null });
  const onWordRef = useRef(onWord);

  // Sliding-window state, all in refs so the frame loop never re-renders.
  const windowRef = useRef<TimedFrame[]>([]);
  const guessHistoryRef = useRef<WordGuess[][]>([]);
  const evidenceRef = useRef<CandidateEvidence[]>([]);
  const lastInferRef = useRef(0);
  const lastHandAtRef = useRef(0);
  const lastEmitRef = useRef<{ gloss: string; at: number } | null>(null);

  useEffect(() => {
    onWordRef.current = onWord;
  }, [onWord]);

  const publish = useCallback((next: Partial<AslRuntime>) => {
    setRuntime((prev) => {
      // The frame loop reports hand visibility several times per second, even
      // when the count is unchanged. Preserve the current object in that case
      // so React can skip rendering the camera panel and its surrounding UI.
      const keys = Object.keys(next) as (keyof AslRuntime)[];
      const unchanged = keys.every((key) => {
        if (key === "guesses") {
          const before = prev.guesses;
          const after = next.guesses;
          return before === after || Boolean(
            before && after && before.length === after.length &&
            before.every((guess, index) =>
              guess.gloss === after[index].gloss &&
              Math.round(guess.probability * 100) === Math.round(after[index].probability * 100),
            ),
          );
        }
        return Object.is(prev[key], next[key]);
      });
      if (unchanged) return prev;
      return { ...prev, ...next };
    });
  }, []);

  const resetContinuous = useCallback(() => {
    windowRef.current = [];
    guessHistoryRef.current = [];
    evidenceRef.current = [];
  }, []);

  /** One continuous-mode inference over the current sliding window. */
  const inferContinuous = useCallback(async (sessionId: number) => {
    if (sessionId !== sessionRef.current || busyRef.current) return;
    const frames = trimSegment(windowRef.current.map((entry) => entry.frame));
    if (frames.length < MIN_FRAMES) return;

    busyRef.current = true;
    try {
      const classifier = await getAslClassifier();
      const guesses = await classifier.classify(frames);
      // The user may have stopped the camera or changed modes while the model
      // was running. A stale result must never add a word or speak afterward.
      if (sessionId !== sessionRef.current) return;
      const top = guesses[0];

      guessHistoryRef.current = [...guessHistoryRef.current.slice(-(EVIDENCE_COUNT - 1)), guesses];
      const smoothed = smoothGuesses(guessHistoryRef.current);
      evidenceRef.current = [
        ...evidenceRef.current.slice(-(EVIDENCE_COUNT - 1)),
        { guesses },
      ];
      const confirmed = confirmCandidate(evidenceRef.current);

      const last = lastEmitRef.current;
      const repeat = Boolean(
        last && confirmed && last.gloss === confirmed.gloss && performance.now() - last.at < REPEAT_BLOCK_MS,
      );

      if (confirmed && !repeat) {
        lastEmitRef.current = { gloss: confirmed.gloss, at: performance.now() };
        resetContinuous(); // the next word starts from a clean window
        publish({ guesses: smoothed, message: `Added “${confirmed.gloss}”` });
        onWordRef.current(confirmed);
      } else if (confirmed && repeat) {
        resetContinuous();
        publish({ guesses: smoothed, message: "Same word just added — sign the next word." });
      } else {
        publish({
          guesses: smoothed,
          message: top ? `Checking “${top.gloss}”…` : "Watching…",
        });
      }
    } catch (error) {
      if (sessionId === sessionRef.current) {
        console.error("[asl] continuous classify failed", error);
        publish({ message: "Could not classify that sign. Keep signing or restart ASL Words." });
      }
    } finally {
      busyRef.current = false;
    }
  }, [publish, resetContinuous]);

  useEffect(() => {
    const sessionId = ++sessionRef.current;
    if (!enabled) {
      windowRef.current = [];
      guessHistoryRef.current = [];
      evidenceRef.current = [];
      overlayHandsRef.current = { left: null, right: null };
      lastInferRef.current = 0;
      lastHandAtRef.current = 0;
      lastEmitRef.current = null;
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
    let lastVideoTime = -1;
    let lastUi = 0;
    let lastOverlay = 0;
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
        disposeHolistic();
        stopCamera?.();
        stopCamera = null;
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
          if (!usingVideoFrame) {
            if (video.currentTime === lastVideoTime) {
              schedule(tick);
              return;
            }
            lastVideoTime = video.currentTime;
          }
          try {
            const result = detectHolistic(holistic.landmarker, video, now);
            const leftHand = result.leftHandLandmarks?.[0] ?? null;
            const rightHand = result.rightHandLandmarks?.[0] ?? null;
            const hands = [leftHand, rightHand].filter(
              (hand): hand is NonNullable<typeof hand> => Boolean(hand && hand.length),
            );
            overlayHandsRef.current = {
              left: smoothOverlayHand(overlayHandsRef.current.left, leftHand),
              right: smoothOverlayHand(overlayHandsRef.current.right, rightHand),
            };
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
                void inferContinuous(sessionId);
              }
            }

            const displayHands = [overlayHandsRef.current.left, overlayHandsRef.current.right].filter(
              (hand): hand is Point3[] => Boolean(hand),
            );
            if (now - lastOverlay >= 33) {
              lastOverlay = now;
              drawHands(canvas, video, displayHands, hands.length > 0);
            }

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
      sessionRef.current += 1;
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
      guessHistoryRef.current = [];
      evidenceRef.current = [];
      overlayHandsRef.current = { left: null, right: null };
    };
    // facing: switching front/rear restarts the camera in place.
  }, [enabled, facing, publish, videoRef, canvasRef, inferContinuous, resetContinuous]);

  return { runtime };
}
