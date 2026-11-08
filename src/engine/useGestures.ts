"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  ABORT_COOLDOWN_MS,
  type GestureId,
  type GestureState,
  type HandCandidate,
  type HandSide,
  type SignCandidate,
} from "@/lib/contracts";
import { phraseForGesture } from "@/lib/starter-phrases";
import { clamp, lerp } from "@/lib/utils";
import { describeCameraError, startCamera } from "./camera";
import { detect, getRecognizer, resetRecognizer } from "./recognizer";
import { isGestureId, SignStabilizer } from "./stabilize";
import { HandTracker, type TrackedHand } from "./hand-tracker";
import { LandmarkBuffer } from "./landmark-buffer";
import { LocalStubRecognizer, type SignRecognizer, type SignResult } from "./sign-recognizer";
import { HAND_CONNECTIONS, type Landmark } from "./landmarks";
import { getASLAlphabetClassifier, type ASLAlphabetClassifier } from "./asl-alphabet";

export type SignLock = {
  id: string;
  label: string;
  phrase: string;
  gesture: GestureId;
  confidence: number;
  hands: 1 | 2;
  side?: HandSide;
};

type LockHandler = (lock: SignLock) => void;

export type UseGesturesOptions = {
  enabled: boolean;
  dwellMs: number;
  /** How long the same held signal must wait before it can speak again. */
  repeatMs: number;
  /** When false, only the most confident hand is considered. */
  twoHands: boolean;
  /** Use the supplied fingerspelling dataset to recognize static ASL letters. */
  alphabetMode: boolean;
  onLock: LockHandler;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  ringRef: RefObject<HTMLDivElement | null>;
};

export type GestureRuntime = {
  state: GestureState;
  message: string;
  /** Every tracked hand, for the live cards. */
  hands: HandCandidate[];
  /** The phrase currently proposed by the recognizer. */
  sign: SignCandidate | null;
  /** Set when the current proposal is a two-hand pair. */
  combo: SignCandidate | null;
  /** Milliseconds left before the same held signal may repeat. */
  repeatWaitMs: number;
  fps: number;
};

const CONNECTED = HAND_CONNECTIONS;

function drawOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  hands: TrackedHand[],
  activeIds: Set<string>,
) {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const line = clamp(width / 260, 2, 6);
  const dot = clamp(width / 190, 3, 9);

  for (const hand of hands) {
    const landmarks = hand.landmarks;
    if (!landmarks || landmarks.length === 0) continue;

    const active = activeIds.has(hand.id);
    const confident = hand.confidence >= 0.65;
    const color = active
      ? "rgba(255, 122, 0, 0.95)"
      : confident
        ? "rgba(125, 211, 252, 0.95)"
        : "rgba(251, 191, 36, 0.95)";
    const glow = active
      ? "rgba(255, 122, 0, 0.85)"
      : confident
        ? "rgba(56, 189, 248, 0.8)"
        : "rgba(245, 158, 11, 0.8)";

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = width / 40;
    ctx.lineWidth = line;

    for (const [from, to] of CONNECTED) {
      const a = landmarks[from];
      const b = landmarks[to];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
      ctx.stroke();
    }

    for (const point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, dot, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function unionBounds(hands: TrackedHand[]) {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  let found = false;

  for (const hand of hands) {
    if (!hand.landmarks || hand.landmarks.length === 0) continue;
    found = true;
    for (const point of hand.landmarks) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }
  }

  return found ? { minX, maxX, minY, maxY } : null;
}

export function useGestures(options: UseGesturesOptions) {
  const { enabled, dwellMs, repeatMs, twoHands, alphabetMode, onLock, videoRef, canvasRef, stageRef, ringRef } =
    options;

  const [runtime, setRuntime] = useState<GestureRuntime>({
    state: "idle",
    message: "Camera off",
    hands: [],
    sign: null,
    combo: null,
    repeatWaitMs: 0,
    fps: 0,
  });

  const onLockRef = useRef(onLock);
  const twoHandsRef = useRef(twoHands);
  const alphabetModeRef = useRef(alphabetMode);
  const alphabetClassifierRef = useRef<ASLAlphabetClassifier | null>(null);
  const alphabetErrorRef = useRef(false);
  const dwellRef = useRef(dwellMs);
  const trackerRef = useRef(new HandTracker());
  const bufferRef = useRef(new LandmarkBuffer());
  const signRecognizerRef = useRef<SignRecognizer>(new LocalStubRecognizer());
  const signStabilizerRef = useRef(new SignStabilizer(dwellMs, 2, ABORT_COOLDOWN_MS));
  const zoomRef = useRef({ cx: 0.5, cy: 0.5, z: 1, primed: false });

  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  useEffect(() => {
    twoHandsRef.current = twoHands;
    bufferRef.current.clear();
    signStabilizerRef.current.reset();
  }, [twoHands]);

  useEffect(() => {
    dwellRef.current = dwellMs;
    signStabilizerRef.current.setDwell(dwellMs);
  }, [dwellMs]);

  useEffect(() => {
    signStabilizerRef.current.setRepeat(repeatMs);
  }, [repeatMs]);

  const publish = useCallback((next: Partial<GestureRuntime>) => {
    setRuntime((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    alphabetModeRef.current = alphabetMode;
    bufferRef.current.clear();
    signStabilizerRef.current.reset();
    if (!alphabetMode) {
      alphabetErrorRef.current = false;
      return;
    }

    alphabetErrorRef.current = false;
    if (!alphabetClassifierRef.current) {
      publish({ message: "Loading ASL alphabet data…", sign: null, combo: null });
      void getASLAlphabetClassifier().then(
        (classifier) => {
          alphabetClassifierRef.current = classifier;
        },
        () => {
          alphabetErrorRef.current = true;
        },
      );
    }
  }, [alphabetMode, publish]);

  const applyZoom = useCallback(
    (hands: TrackedHand[]) => {
      const stage = stageRef.current;
      if (!stage) return;

      let targetX = 0.5;
      let targetY = 0.5;
      let targetZ = 1;

      const box = unionBounds(hands);
      if (box) {
        const size = Math.max(box.maxX - box.minX, box.maxY - box.minY, 0.02);
        targetZ = clamp(0.62 / size, 1, 2.1);
        // Preview is mirrored, so mirror the centre we zoom toward.
        targetX = 1 - (box.minX + box.maxX) / 2;
        targetY = (box.minY + box.maxY) / 2;
      }

      const zoom = zoomRef.current;
      const alpha = zoom.primed ? 0.14 : 1;
      zoom.cx = lerp(zoom.cx, targetX, alpha);
      zoom.cy = lerp(zoom.cy, targetY, alpha);
      zoom.z = lerp(zoom.z, targetZ, alpha);
      zoom.primed = true;

      const tx = clamp(0.5 - zoom.z * zoom.cx, 1 - zoom.z, 0);
      const ty = clamp(0.5 - zoom.z * zoom.cy, 1 - zoom.z, 0);
      stage.style.transform = `translate3d(${(tx * 100).toFixed(3)}%, ${(ty * 100).toFixed(3)}%, 0) scale(${zoom.z.toFixed(3)})`;
    },
    [stageRef],
  );

  useEffect(() => {
    if (!enabled) {
      trackerRef.current.reset();
      bufferRef.current.clear();
      signStabilizerRef.current.reset();
      publish({
        state: "idle",
        message: "Camera off",
        hands: [],
        sign: null,
        combo: null,
        repeatWaitMs: 0,
        fps: 0,
      });
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
      publish({ state: "starting", message: "Requesting camera…", hands: [], sign: null, combo: null });

      let handle: Awaited<ReturnType<typeof startCamera>>;
      try {
        handle = await startCamera(video, () => cancelled);
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
      publish({ state: "starting", message: "Warming up hand tracking…" });

      let recognizer: Awaited<ReturnType<typeof getRecognizer>>;
      try {
        recognizer = await getRecognizer();
      } catch (error) {
        if (cancelled) return;
        const missing = error instanceof Error && /404|fetch|model|wasm/i.test(error.message);
        publish({
          state: "error",
          message: missing
            ? "Hand-tracking assets are missing. Run `npm run setup:assets`, then reload."
            : "Hand tracking failed to load. Check the console, or use keys 1–9.",
        });
        resetRecognizer();
        // The stream is already live; stop it so the camera light does not
        // stay on behind the error overlay.
        stopCamera?.();
        stopCamera = null;
        return;
      }

      if (cancelled) return;
      publish({ state: "ready", message: "Show your hand to the camera" });
      trackerRef.current.reset();
      bufferRef.current.clear();
      signStabilizerRef.current.reset();

      const tick = (now: number) => {
        if (cancelled) return;

        if (video.readyState >= 2 && video.videoWidth > 0) {
          try {
            const frame = detect(recognizer, video, now);
            const tracked = trackerRef.current.update(frame.hands, now);
            const wowHands = tracked.filter(
              (hand) => hand.gesture === "Wow" && hand.confidence >= 0.5,
            );
            const fingerHeartHands = tracked.filter(
              (hand) => hand.gesture === "Finger_Heart" && hand.confidence >= 0.5,
            );
            const middleFingerHands = tracked.filter(
              (hand) => hand.gesture === "Middle_Finger" && hand.confidence >= 0.5,
            );
            const hasDoubleWow = twoHandsRef.current && wowHands.length >= 2;
            const hasDoubleFingerHeart = twoHandsRef.current && fingerHeartHands.length >= 2;
            const hasDoubleMiddleFinger = twoHandsRef.current && middleFingerHands.length >= 2;
            const alphabetSpecialHands = hasDoubleWow
              ? wowHands.slice(0, 2)
              : hasDoubleFingerHeart
                ? fingerHeartHands.slice(0, 2)
                : hasDoubleMiddleFinger
                  ? middleFingerHands.slice(0, 2)
                  : fingerHeartHands.slice(0, 1);
            const useOneHand =
              !twoHandsRef.current ||
              (alphabetModeRef.current &&
                !hasDoubleWow &&
                !hasDoubleFingerHeart &&
                !hasDoubleMiddleFinger);
            const usable =
              alphabetModeRef.current && alphabetSpecialHands.length > 0
                ? alphabetSpecialHands
                : useOneHand
                  ? [...tracked].sort((a, b) => b.confidence - a.confidence).slice(0, 1)
                  : tracked;

            const landmarkFrame = {
              t: now,
              hands: usable.map((hand) => ({
                id: hand.id,
                side: hand.side,
                gesture: hand.gesture,
                confidence: hand.confidence,
                landmarks: hand.landmarks,
              })),
            };
            bufferRef.current.push(landmarkFrame);

            let sign: SignResult | null;
            if (alphabetModeRef.current && alphabetSpecialHands.length > 0) {
              sign = signRecognizerRef.current.recognize([landmarkFrame]);
            } else if (alphabetModeRef.current) {
              const hand = usable[0];
              const letter = alphabetClassifierRef.current?.classify(hand?.landmarks, hand?.side);
              sign = letter
                ? {
                    id: `asl-${letter.letter}`,
                    label: letter.letter,
                    phrase: letter.letter,
                    gesture: `ASL_${letter.letter}` as GestureId,
                    hands: 1,
                    side: letter.side,
                    confidence: letter.confidence,
                    model: "asl-landmarks-knn",
                  }
                : null;
            } else {
              sign = signRecognizerRef.current.recognize(bufferRef.current.snapshot(400));
            }
            const result = signStabilizerRef.current.push(
              sign ? { sign: sign.id, confidence: sign.confidence } : null,
              now,
              // A pair is easier to form by accident, so give it a longer hold.
              sign?.hands === 2 ? Math.max(dwellRef.current, 500) : dwellRef.current,
            );

            const activeIds = new Set<string>();
            if (sign?.hands === 1) {
              const match = usable.find((hand) => hand.side === sign.side) ?? usable[0];
              if (match) activeIds.add(match.id);
            } else if (sign?.hands === 2) {
              for (const hand of usable) activeIds.add(hand.id);
            }

            drawOverlay(canvas, video, usable, activeIds);
            applyZoom(usable);

            if (ringRef.current) {
              ringRef.current.style.setProperty("--hold", result.progress.toFixed(3));
            }

            if (result.locked && sign && result.locked === sign.id) {
              onLockRef.current(sign);
            }

            frames += 1;
            if (now - fpsWindowStart >= 1000) {
              const fps = Math.round((frames * 1000) / (now - fpsWindowStart));
              frames = 0;
              fpsWindowStart = now;
              publish({ fps });
            }

            if (now - lastUi > 100) {
              lastUi = now;

              const handCandidates: HandCandidate[] = usable.map((hand) => {
                const gesture = alphabetModeRef.current
                  ? (sign?.gesture ?? null)
                  : isGestureId(hand.gesture)
                    ? hand.gesture
                    : null;
                return {
                  id: hand.id,
                  side: hand.side,
                  gesture,
                  label: alphabetModeRef.current
                    ? sign?.label ?? "No letter"
                    : gesture
                      ? (phraseForGesture(gesture)?.label ?? "Gesture")
                      : "No gesture",
                  confidence: alphabetModeRef.current ? (sign?.confidence ?? 0) : hand.confidence,
                };
              });

              const combo: SignCandidate | null =
                sign && sign.hands === 2
                  ? {
                      id: sign.id,
                      label: sign.label,
                      phrase: sign.phrase,
                      confidence: sign.confidence,
                      hands: 2,
                    }
                  : null;

              const signCandidate: SignCandidate | null = sign
                ? {
                    id: sign.id,
                    label: sign.label,
                    phrase: sign.phrase,
                    confidence: sign.confidence,
                    hands: sign.hands,
                    side: sign.side,
                  }
                : null;

              const message =
                alphabetModeRef.current && alphabetErrorRef.current
                  ? "ASL alphabet data could not load. Turn alphabet mode off and retry."
                  : alphabetModeRef.current && !alphabetClassifierRef.current
                    ? "Loading ASL alphabet data…"
                    : usable.length === 0
                  ? "Show your hand to the camera"
                  : sign
                    ? result.repeatWaitMs > 0
                      ? `Same signal — repeats in ${(result.repeatWaitMs / 1000).toFixed(1)}s`
                      : alphabetModeRef.current
                        ? "Hold the letter to add it"
                        : "Hold to lock the phrase"
                    : usable.length >= 2
                      ? "Two hands — no matching pair"
                      : "Show a starter gesture";

              publish({
                hands: handCandidates,
                combo,
                sign: signCandidate,
                repeatWaitMs: Math.round(result.repeatWaitMs),
                message,
                state: "ready",
              });
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
          (
            video as HTMLVideoElement & { cancelVideoFrameCallback?: (id: number) => void }
          ).cancelVideoFrameCallback?.(frameHandle);
        } else {
          cancelAnimationFrame(frameHandle);
        }
      }
      stopCamera?.();
      trackerRef.current.reset();
      bufferRef.current.clear();
      signStabilizerRef.current.reset();
      zoomRef.current = { cx: 0.5, cy: 0.5, z: 1, primed: false };
      if (stageRef.current) stageRef.current.style.transform = "";
      if (ringRef.current) ringRef.current.style.setProperty("--hold", "0");
    };
  }, [enabled, publish, applyZoom, videoRef, canvasRef, stageRef, ringRef]);

  return runtime;
}
