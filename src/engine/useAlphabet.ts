"use client";

// [alphabet] Fingerspelling mode. Reuses the starter GestureRecognizer only for
// its 21 hand landmarks, classifies the dominant hand every frame with the
// alphabet MLP, locks a letter after a short hold, and spells a word that the
// user commits to the sentence strip.

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { GestureState, HandSide } from "@/lib/contracts";
import { clamp } from "@/lib/utils";
import { describeCameraError, startCamera } from "./camera";
import { detect, getRecognizer, recognizerDelegate, resetRecognizer } from "./recognizer";
import { getAlphabetClassifier, LetterLock, type LetterGuess } from "./alphabet-classifier";
import { HAND_CONNECTIONS, type Landmark } from "./landmarks";

export type AlphabetRuntime = {
  state: GestureState;
  message: string;
  fps: number;
  delegate: "GPU" | "CPU" | null;
  hand: HandSide | null;
  guesses: LetterGuess[] | null;
  /** 0..1 hold progress for the current letter. */
  progress: number;
  spelled: string;
};

export type UseAlphabetOptions = {
  enabled: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Called with the spelled word when the user commits it. */
  onWord: (word: string) => void;
};

/** Debug toggles: ?alphaFlip=1 inverts which hand gets mirrored; ?alphaAspect=0 disables aspect correction. */
function readOptions() {
  if (typeof window === "undefined") return { flip: false, aspect: true };
  const params = new URLSearchParams(window.location.search);
  return { flip: params.get("alphaFlip") === "1", aspect: params.get("alphaAspect") !== "0" };
}

function drawHand(canvas: HTMLCanvasElement, video: HTMLVideoElement, hand: Landmark[] | null, locked: boolean) {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (!hand) return;
  const color = locked ? "rgba(255, 122, 0, 0.95)" : "rgba(125, 211, 252, 0.95)";
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = clamp(width / 260, 2, 6);
  const dot = clamp(width / 190, 3, 9);
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
  ctx.restore();
}

export function useAlphabet({ enabled, videoRef, canvasRef, onWord }: UseAlphabetOptions) {
  const [runtime, setRuntime] = useState<AlphabetRuntime>({
    state: "idle",
    message: "Camera off",
    fps: 0,
    delegate: null,
    hand: null,
    guesses: null,
    progress: 0,
    spelled: "",
  });

  const spelledRef = useRef("");
  const lockRef = useRef(new LetterLock());
  const busyRef = useRef(false);
  const onWordRef = useRef(onWord);

  useEffect(() => {
    onWordRef.current = onWord;
  }, [onWord]);

  const publish = useCallback((next: Partial<AlphabetRuntime>) => {
    setRuntime((prev) => ({ ...prev, ...next }));
  }, []);

  const setSpelled = useCallback(
    (value: string) => {
      spelledRef.current = value;
      publish({ spelled: value });
    },
    [publish],
  );

  const backspace = useCallback(() => setSpelled(spelledRef.current.slice(0, -1)), [setSpelled]);
  const clear = useCallback(() => setSpelled(""), [setSpelled]);
  const commit = useCallback(() => {
    const word = spelledRef.current.trim();
    if (!word) return;
    onWordRef.current(word);
    setSpelled("");
    publish({ message: `Added “${word}”` });
  }, [publish, setSpelled]);
  const addSpace = useCallback(() => {
    if (spelledRef.current && !spelledRef.current.endsWith(" ")) setSpelled(`${spelledRef.current} `);
  }, [setSpelled]);

  // Keyboard: Backspace deletes, Enter commits, Escape clears, Space adds a space.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return;
      if (event.key === "Backspace") backspace();
      else if (event.key === "Enter") commit();
      else if (event.key === "Escape") clear();
      else if (event.key === " ") addSpace();
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, backspace, commit, clear, addSpace]);

  useEffect(() => {
    if (!enabled) {
      lockRef.current.reset();
      publish({ state: "idle", message: "Camera off", fps: 0, hand: null, guesses: null, progress: 0 });
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
    const options = readOptions();

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
      publish({ state: "starting", message: "Loading alphabet model…" });

      let recognizer: Awaited<ReturnType<typeof getRecognizer>>;
      let classifier: Awaited<ReturnType<typeof getAlphabetClassifier>>;
      try {
        [recognizer, classifier] = await Promise.all([getRecognizer(), getAlphabetClassifier()]);
      } catch (error) {
        if (cancelled) return;
        console.error("[alphabet] model load failed", error);
        publish({
          state: "error",
          message: "Alphabet model is missing or failed to load. Run `npm run setup:assets`, then reload.",
        });
        resetRecognizer();
        return;
      }
      if (cancelled) return;
      publish({ state: "ready", delegate: recognizerDelegate(), message: "Fingerspell a letter and hold it" });

      const tick = (now: number) => {
        if (cancelled) return;
        if (video.readyState >= 2 && video.videoWidth > 0) {
          try {
            const frame = detect(recognizer, video, now);
            const withLandmarks = frame.hands.filter((hand) => hand.landmarks);
            // Dominant hand: the physical right hand if visible, else whichever is there.
            const hand = withLandmarks.find((h) => h.side === "right") ?? withLandmarks[0] ?? null;
            drawHand(canvas, video, hand?.landmarks ?? null, false);

            if (!hand) {
              lockRef.current.push(null, 0, now);
              if (now - lastUi > 150) {
                lastUi = now;
                publish({ hand: null, guesses: null, progress: 0 });
              }
            } else if (!busyRef.current) {
              busyRef.current = true;
              // Mirror the left hand so both hands look like the (right-handed) training data.
              const mirror = (hand.side === "left") !== options.flip;
              const aspect = options.aspect ? video.videoWidth / video.videoHeight : 1;
              void classifier
                .classify(hand.landmarks!, { mirror, aspect, lettersOnly: true })
                .then((guesses) => {
                  if (cancelled) return;
                  const top = guesses[0];
                  const result = lockRef.current.push(top?.letter ?? null, top?.probability ?? 0, performance.now());
                  if (result.locked) {
                    setSpelled(spelledRef.current + result.locked);
                    drawHand(canvas, video, hand.landmarks, true);
                  }
                  const t = performance.now();
                  if (result.locked || t - lastUi > 100) {
                    lastUi = t;
                    publish({ hand: hand.side, guesses, progress: result.progress });
                  }
                })
                .catch((error) => console.error("[alphabet] classify failed", error))
                .finally(() => {
                  busyRef.current = false;
                });
            }

            frames += 1;
            if (now - fpsWindowStart >= 1000) {
              publish({ fps: Math.round((frames * 1000) / (now - fpsWindowStart)) });
              frames = 0;
              fpsWindowStart = now;
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
      lockRef.current.reset();
    };
  }, [enabled, publish, setSpelled, videoRef, canvasRef]);

  return { runtime, backspace, clear, commit, addSpace };
}
