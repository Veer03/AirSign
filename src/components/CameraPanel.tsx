"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RotateCcw, ShieldCheck } from "lucide-react";
import type { GestureEvent, HandCandidate } from "@/lib/contracts";
import { makeSignEvent } from "@/lib/starter-phrases";
import { useGestures, type AlphabetModel, type SignLock } from "@/engine/useGestures";
import { useAslWords } from "@/engine/useAslWords";
import { glossToText, type WordGuess } from "@/engine/asl-classifier";
import { saveDelegate, savedDelegate, type Delegate } from "@/engine/delegate";
import { disposeRecognizer } from "@/engine/recognizer";
import { disposeHolistic } from "@/engine/holistic";
import type { CameraFacing } from "@/engine/camera";
import type { Landmark } from "@/engine/landmarks";
import type { StoredCustomGesture } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { HoldRing } from "./HoldRing";
import { PixelPanel } from "./PixelPanel";

type CameraPanelProps = {
  enabled: boolean;
  dwellMs: number;
  /** Wait before the same held signal can speak again. */
  repeatMs: number;
  twoHands: boolean;
  /** Harshpal's kNN fingerspelling mode (owned by the page). */
  alphabetMode: boolean;
  onAlphabetModeChange?: (on: boolean) => void;
  onWordsModeChange?: (on: boolean) => void;
  /** Harshpal's ASL 1–10 mode (owned by the page). */
  numberMode: boolean;
  onNumberModeChange?: (on: boolean) => void;
  /** User-recorded gestures; only active while Custom is selected. */
  customMode?: boolean;
  onCustomModeChange?: (on: boolean) => void;
  customGestures?: StoredCustomGesture[];
  captureRequestId?: number;
  onCustomCaptured?: (frames: Landmark[][][]) => void;
  onCustomCaptureStatus?: (status: { state: "idle" | "countdown" | "capturing" | "saved" | "error"; message: string }) => void;
  practiceLetter?: string | null;
  practiceNumber?: string | null;
  onEnable: () => void;
  onDisable?: () => void;
  onLock: (event: GestureEvent) => void;
  /** Front ("user") or rear ("environment") camera; rear is offered on mobile only. */
  facing?: CameraFacing;
};

export function CameraPanel(props: CameraPanelProps) {
  const [attempt, setAttempt] = useState(0);
  return (
    <CameraSurface
      key={attempt}
      {...props}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  );
}

const MODES = ["starter", "words", "alphabet", "numbers", "custom"] as const;
type Mode = (typeof MODES)[number];
const MODE_LABELS: Record<Mode, string> = {
  starter: "starter phrases",
  words: "ASL words",
  alphabet: "A–Z letters",
  numbers: "ASL numbers",
  custom: "Custom",
};
const MODE_GROUPS = [
  { label: "Quick phrases", modes: ["starter"] as const },
  { label: "ASL recognition", modes: ["words", "alphabet", "numbers"] as const },
  { label: "Your gestures", modes: ["custom"] as const },
] as const;

function sideTag(side: HandCandidate["side"]) {
  if (side === "left") return "L";
  if (side === "right") return "R";
  return "?";
}

function CameraSurface({
  enabled,
  dwellMs,
  repeatMs,
  twoHands,
  alphabetMode,
  onAlphabetModeChange,
  onWordsModeChange,
  numberMode,
  onNumberModeChange,
  customMode = false,
  onCustomModeChange,
  customGestures = [],
  captureRequestId = 0,
  onCustomCaptured,
  onCustomCaptureStatus,
  practiceLetter,
  practiceNumber,
  facing = "user",
  onEnable,
  onDisable,
  onLock,
  onRetry,
}: CameraPanelProps & { onRetry: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  // "starter" = MediaPipe handshapes; "words" = Holistic + asl-signs model;
  // "alphabet" = static A–Z classifiers (page-owned alphabetMode, same
  // GestureRecognizer pipeline as starter); "custom" = user-recorded landmarks.
  const [baseMode, setBaseMode] = useState<"starter" | "words">("starter");
  const [alphabetModel, setAlphabetModel] = useState<AlphabetModel>("knn");
  const latestLandmarksRef = useRef<Landmark[][] | null>(null);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  const [captureRecording, setCaptureRecording] = useState(false);
  const captureFramesRef = useRef<Landmark[][][]>([]);
  const captureRecordingUntilRef = useRef<number | null>(null);
  const lastCaptureRequestRef = useRef(0);
  const CAPTURE_MOTION_MS = 2200;

  // Practice drill letters are checked with the pretrained classifier.
  useEffect(() => {
    if (practiceLetter) setAlphabetModel("pretrained");
  }, [practiceLetter]);

  const mode: Mode = customMode
    ? "custom"
    : numberMode
      ? "numbers"
      : alphabetMode
        ? "alphabet"
        : baseMode;

  const switchMode = useCallback(
    (next: Mode) => {
      if (next === "alphabet") {
        onWordsModeChange?.(false);
        onCustomModeChange?.(false);
        onNumberModeChange?.(false);
        onAlphabetModeChange?.(true);
      } else if (next === "numbers") {
        onWordsModeChange?.(false);
        onCustomModeChange?.(false);
        onAlphabetModeChange?.(false);
        onNumberModeChange?.(true);
      } else if (next === "custom") {
        onWordsModeChange?.(false);
        onAlphabetModeChange?.(false);
        onNumberModeChange?.(false);
        onCustomModeChange?.(true);
      } else {
        onWordsModeChange?.(next === "words");
        onAlphabetModeChange?.(false);
        onNumberModeChange?.(false);
        onCustomModeChange?.(false);
        setBaseMode(next);
      }
    },
    [onAlphabetModeChange, onCustomModeChange, onNumberModeChange, onWordsModeChange],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("mode");
    if (params.get("alphabetModel") === "pretrained" || fromUrl === "alphabet-pretrained") {
      setAlphabetModel("pretrained");
    }
    if (fromUrl === "alphabet-pretrained") switchMode("alphabet");
    else if (fromUrl && (MODES as readonly string[]).includes(fromUrl)) switchMode(fromUrl as Mode);
    // Mount only: the URL seeds the initial mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstUrlSync = useRef(true);
  useEffect(() => {
    if (firstUrlSync.current) {
      firstUrlSync.current = false;
      return;
    }
    const url = new URL(window.location.href);
    if (mode === "starter") {
      url.searchParams.delete("mode");
      url.searchParams.delete("alphabetModel");
    } else {
      url.searchParams.set("mode", mode);
      if (mode === "alphabet" && alphabetModel === "pretrained") {
        url.searchParams.set("alphabetModel", "pretrained");
      } else {
        url.searchParams.delete("alphabetModel");
      }
    }
    window.history.replaceState(null, "", url);
  }, [mode, alphabetModel]);

  const words = mode === "words";
  const knnAlphabet = alphabetModel === "knn";
  const custom = mode === "custom";

  useEffect(() => {
    if (!custom) {
      setCaptureCountdown(null);
      setCaptureRecording(false);
      captureFramesRef.current = [];
      captureRecordingUntilRef.current = null;
    }
  }, [custom]);

  const cloneHands = (hands: Landmark[][]) => hands.map((hand) => hand.map((p) => ({ ...p })));

  const handleCaptureFrame = useCallback(
    (hands: Landmark[][] | null) => {
      const cloned = hands && hands.length > 0 ? cloneHands(hands) : null;
      latestLandmarksRef.current = cloned;
      if (!custom || !captureRecording) return;
      if (cloned) {
        captureFramesRef.current.push(cloned);
        if (captureFramesRef.current.length > 60) captureFramesRef.current.shift();
      }
      const until = captureRecordingUntilRef.current;
      if (until && performance.now() >= until) {
        setCaptureRecording(false);
        captureRecordingUntilRef.current = null;
        const frames = captureFramesRef.current;
        captureFramesRef.current = [];
        if (frames.length === 0) {
          onCustomCaptureStatus?.({ state: "error", message: "No hands detected while recording. Show 1 or 2 hands and try again." });
          return;
        }
        onCustomCaptureStatus?.({ state: "capturing", message: "Saving gesture…" });
        onCustomCaptured?.(frames);
      }
    },
    [captureRecording, custom, onCustomCaptureStatus, onCustomCaptured],
  );

  useEffect(() => {
    if (!custom || !captureRequestId || captureRequestId === lastCaptureRequestRef.current) return;
    lastCaptureRequestRef.current = captureRequestId;
    if (!enabled) {
      onCustomCaptureStatus?.({ state: "error", message: "Turn the camera on before capturing." });
      return;
    }
    setCaptureRecording(false);
    captureFramesRef.current = [];
    captureRecordingUntilRef.current = null;
    setCaptureCountdown(3);
    onCustomCaptureStatus?.({ state: "countdown", message: "Hold your gesture steady… 3" });
  }, [captureRequestId, custom, enabled, onCustomCaptureStatus]);

  useEffect(() => {
    if (captureCountdown === null) return;
    if (captureCountdown <= 0) {
      setCaptureCountdown(null);
      const current = latestLandmarksRef.current;
      if (!current || current.length === 0) {
        onCustomCaptureStatus?.({ state: "error", message: "No hands detected. Show 1 or 2 hands clearly and try again." });
        return;
      }
      captureFramesRef.current = [cloneHands(current)];
      captureRecordingUntilRef.current = performance.now() + CAPTURE_MOTION_MS;
      setCaptureRecording(true);
      onCustomCaptureStatus?.({ state: "capturing", message: "Recording motion now — perform your full gesture." });
      return;
    }
    const timer = window.setTimeout(() => {
      const next = captureCountdown - 1;
      setCaptureCountdown(next);
      if (next > 0) onCustomCaptureStatus?.({ state: "countdown", message: `Hold your gesture steady… ${next}` });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [captureCountdown, onCustomCaptureStatus]);

  // CPU/GPU toggle: saved in localStorage; switching rebuilds the models by
  // remounting this surface (same path as "Try again").
  const [delegateChoice, setDelegateChoice] = useState<Delegate | null>(null);
  useEffect(() => setDelegateChoice(savedDelegate()), []);
  const switchDelegate = useCallback(
    (next: Delegate) => {
      saveDelegate(next);
      const url = new URL(window.location.href);
      url.searchParams.delete("delegate"); // the toggle wins over a stale URL override
      window.history.replaceState(null, "", url);
      disposeRecognizer();
      disposeHolistic();
      onRetry();
    },
    [onRetry],
  );

  const handleLock = useCallback(
    (lock: SignLock) => {
      onLock(makeSignEvent(lock, lock.confidence, "camera"));
    },
    [onLock],
  );

  const handleWord = useCallback(
    (guess: WordGuess) => {
      onLock({
        id: `asl-${guess.gloss}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        gesture: "Unknown",
        label: `ASL · ${guess.gloss}`,
        phrase: glossToText(guess.gloss),
        confidence: guess.probability,
        at: Date.now(),
        source: "camera",
        hands: 1,
      });
    },
    [onLock],
  );

  const asl = useAslWords({ enabled: enabled && words, videoRef, canvasRef, onWord: handleWord, facing });

  const starterRuntime = useGestures({
    enabled: enabled && !words,
    dwellMs,
    repeatMs,
    twoHands,
    alphabetMode,
    alphabetModel,
    numberMode,
    customMode: custom,
    customGestures,
    onCaptureFrame: handleCaptureFrame,
    onLock: handleLock,
    videoRef,
    canvasRef,
    stageRef,
    ringRef,
    facing,
  });
  const runtime = words
    ? { ...starterRuntime, ...asl.runtime, hands: [] as HandCandidate[] }
    : starterRuntime;

  const showError = enabled && (runtime.state === "denied" || runtime.state === "error");
  const starting = enabled && runtime.state === "starting";
  const ready = runtime.state === "ready";
  const handCount = runtime.hands.length;
  const sign = runtime.sign;
  const confidence = sign?.confidence ?? 0;
  // Selfie preview is mirrored; the rear camera shows the scene as-is.
  const mirrored = facing === "user";

  return (
    <PixelPanel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/15 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              ready && "bg-emerald-400",
              starting && "bg-amber-400 pulse-dot",
              showError && "bg-red-500",
              !enabled && "bg-white/30",
            )}
          />
          <span className="label">
            {!enabled
              ? "Camera off"
              : starting
                ? "Starting"
                : showError
                  ? "Camera error"
                  : ready
                    ? "Tracking"
                    : runtime.state}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          <div className="order-first flex w-full flex-wrap gap-2 sm:order-none" aria-label="Recognition modes">
            {MODE_GROUPS.map((group) => (
              <div key={group.label} className="flex min-w-0 items-center border border-white/25" role="group" aria-label={group.label}>
                <span className="label label-title shrink-0 px-2 !text-[8px]">{group.label}</span>
                {group.modes.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => switchMode(value)}
                    className={cn(
                      "label whitespace-nowrap px-2 py-2 transition sm:px-2 sm:py-1",
                      mode === value ? "bg-white/15 !text-white" : "hover:!text-white",
                    )}
                  >
                    {MODE_LABELS[value]}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {alphabetMode ? (
            <div className="flex items-center gap-2 border border-white/20 px-2 py-1" role="group" aria-label="A–Z classifier">
              <span className="label label-title !text-[8px]">A–Z model</span>
              {(["knn", "pretrained"] as const).map((model) => (
                <button
                  key={model}
                  type="button"
                  aria-pressed={alphabetModel === model}
                  onClick={() => setAlphabetModel(model)}
                  className={cn(
                    "label px-2 py-1 !text-[8px] transition",
                    alphabetModel === model ? "bg-white/15 !text-white" : "hover:!text-white",
                  )}
                >
                  {model === "knn" ? "dataset" : "pretrained"}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex border border-white/25" role="group" aria-label="Processing">
            {(["GPU", "CPU"] as const).map((value) => {
              const active = (delegateChoice ?? runtime.delegate ?? "GPU") === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  title={value === "CPU" ? "Use if tracking is slow or labels look wrong" : "Faster when hardware acceleration works"}
                  onClick={() => (active ? undefined : switchDelegate(value))}
                  className={cn("label px-2.5 py-2 transition sm:px-2 sm:py-1", active ? "bg-white/15 !text-white" : "hover:!text-white")}
                >
                  {value.toLowerCase()}
                </button>
              );
            })}
          </div>
          {ready ? (
            <span className="label">
              {runtime.fps} fps
              {runtime.delegate ? ` · ${runtime.delegate.toLowerCase()}` : ""}
            </span>
          ) : null}
          <span className="label hidden items-center gap-1 sm:flex">
            <ShieldCheck className="h-3 w-3" /> on-device
          </span>
          {enabled && onDisable ? (
            <button
              type="button"
              onClick={onDisable}
              className="label ml-auto flex items-center gap-1 border border-white/25 px-2.5 py-2 transition hover:border-white/60 hover:text-white sm:ml-0 sm:px-2 sm:py-1"
            >
              <CameraOff className="h-3 w-3" /> stop
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black sm:aspect-video">
        <div className="absolute inset-0 overflow-hidden">
          <div
            ref={stageRef}
            className="absolute inset-0"
            style={{ transformOrigin: "0 0", willChange: "transform" }}
          >
            <video
              ref={videoRef}
              className={cn("absolute inset-0 h-full w-full object-cover", mirrored && "-scale-x-100")}
              playsInline
              muted
              autoPlay
            />
            <canvas
              ref={canvasRef}
              className={cn("pointer-events-none absolute inset-0 h-full w-full object-cover", mirrored && "-scale-x-100")}
              aria-hidden
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55))]" />

        {!enabled ? (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 p-6 backdrop-blur-[2px]">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center border border-white/40">
                <Camera className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-medium">Turn on the camera</h2>
              <p className="mt-2 text-sm text-white/60">
                {custom
                  ? "Record a gesture in the Custom panel, then perform its motion (1 or 2 hands). Custom gestures work only in Custom mode."
                  : alphabetMode
                    ? knnAlphabet
                      ? "Show one static ASL letter or the Wow pose, or press its A–Z key."
                      : "Show one static ASL letter, or press its A–Z key."
                    : numberMode
                      ? "Show one ASL number handshape from 1 to 10."
                      : "Show a starter gesture with one hand, or hold a matching pair with both."}{" "}
                The video stays in this browser — only text is sent to the server.
              </p>
              <button
                type="button"
                onClick={onEnable}
                className="mt-5 inline-flex items-center gap-2 bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:bg-accent-soft"
              >
                <Camera className="h-4 w-4" /> Enable camera
              </button>
              <p className="label mt-4 !text-[9px]">
                {custom ? "use Capture in the Custom panel" : alphabetMode ? "A–Z keys also work" : numberMode ? "Hold the pose to speak the number" : "or press keys 1–9"}
              </p>
            </div>
          </div>
        ) : null}

        {showError ? (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/85 p-6">
            <div className="max-w-md text-center">
              <p className="label mb-2 text-red-400">camera unavailable</p>
              <p className="text-sm text-white/75">{runtime.message}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex items-center gap-2 border border-white/40 px-4 py-2 text-sm transition hover:border-white"
              >
                <RotateCcw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        ) : null}

        {starting ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/50">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-amber-400 pulse-dot" />
              <span className="label !text-white/80">{runtime.message}</span>
            </div>
          </div>
        ) : null}

        {enabled && ready && words ? (
          <AslOverlay
            handsVisible={asl.runtime.handsVisible}
            message={asl.runtime.message}
            guesses={asl.runtime.guesses}
          />
        ) : null}

        {enabled && ready && !words ? (
          <>
            <div className="absolute left-2 top-2 z-10 sm:left-4 sm:top-4">
              <span className="label flex items-center gap-2 bg-black/60 px-2 py-1 !text-[9px] backdrop-blur">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    handCount > 0 ? "bg-emerald-400" : "bg-white/40",
                  )}
                />
                {alphabetMode || numberMode || custom
                  ? sign?.phrase === "Wow!"
                    ? handCount === 2
                      ? "two Wow hands"
                      : "Wow sign"
                    : handCount === 0
                      ? "show one hand"
                      : custom
                        ? "custom gesture hand"
                        : numberMode
                          ? "ASL number hand"
                          : "ASL alphabet hand"
                  : handCount === 0
                    ? "searching for hands"
                    : handCount === 1
                      ? "1 hand detected"
                      : `${handCount} hands detected`}
              </span>
            </div>

            {handCount > 0 ? (
              <div className="absolute right-2 top-2 z-10 min-w-[9rem] space-y-1.5 sm:right-4 sm:top-4 sm:min-w-[10rem] border border-white/30 bg-black/70 px-3 py-2 backdrop-blur">
                <p className="label !text-[8px]">
                  {runtime.combo ? "two-hand match" : "live candidate"}
                </p>

                {runtime.hands.map((hand) => (
                  <div key={hand.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid h-4 w-4 shrink-0 place-items-center border text-[8px] font-medium",
                        hand.gesture
                          ? "border-accent/60 text-accent"
                          : "border-white/25 text-white/45",
                      )}
                    >
                      {sideTag(hand.side)}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-xs",
                        hand.gesture ? "text-white" : "text-white/45",
                      )}
                    >
                      {hand.label}
                    </span>
                    <span className="label !text-[8px]">
                      {Math.round(hand.confidence * 100)}%
                    </span>
                  </div>
                ))}

                {runtime.combo ? (
                  <div className="border-t border-white/20 pt-1.5">
                    <p className="text-sm font-medium text-accent">{runtime.combo.phrase}</p>
                    <p className="label !text-[8px]">
                      {runtime.combo.label} · 2H
                    </p>
                  </div>
                ) : sign ? (
                  <div className="border-t border-white/20 pt-1.5">
                    <p className="text-sm font-medium">{sign.phrase}</p>
                    <p className="label !text-[8px]">
                      {sign.label} · {sign.hands === 2 ? "2H" : sideTag(sign.side ?? "unknown")}
                    </p>
                    <div className="mt-1.5 h-1 w-full bg-white/15">
                      <div
                        className="h-full bg-accent transition-[width] duration-150"
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                      />
                    </div>
                    {runtime.repeatWaitMs > 0 ? (
                      <p className="label mt-1.5 !text-[8px] !text-accent">
                        repeats in {(runtime.repeatWaitMs / 1000).toFixed(1)}s
                      </p>
                    ) : null}
                  </div>
                ) : handCount >= 2 && twoHands ? (
                  <p className="border-t border-white/20 pt-1.5 text-[10px] leading-snug text-white/50">
                    Two hands — no matching pair
                  </p>
                ) : null}
              </div>
            ) : null}

            {alphabetMode && practiceLetter ? (
              <div className="absolute bottom-2 left-2 z-10 max-w-[45%] border sm:bottom-4 sm:left-4 sm:max-w-none border-white/25 bg-black/75 px-3 py-2 backdrop-blur">
                <p className="label !text-[8px]">practice letter {practiceLetter}</p>
                <p className={cn("mt-1 text-sm font-medium", sign?.label === practiceLetter ? "text-emerald-300" : "text-white")}>
                  {sign?.label === practiceLetter
                    ? "That’s it! Hold to lock it."
                    : sign?.label
                      ? `Camera sees ${sign.label} — try ${practiceLetter}`
                      : `Make ${practiceLetter} from the chart`}
                </p>
              </div>
            ) : null}

            {numberMode && practiceNumber ? (
              <div className="absolute bottom-2 left-2 z-10 max-w-[45%] border sm:bottom-4 sm:left-4 sm:max-w-none border-white/25 bg-black/75 px-3 py-2 backdrop-blur">
                <p className="label !text-[8px]">practice number {practiceNumber}</p>
                <p className={cn("mt-1 text-sm font-medium", sign?.label === practiceNumber ? "text-emerald-300" : "text-white")}>
                  {sign?.label === practiceNumber
                    ? "That’s it! Hold to lock it."
                    : sign?.label
                      ? `Camera sees ${sign.label} — try ${practiceNumber}`
                      : `Make ${practiceNumber} from the chart`}
                </p>
              </div>
            ) : null}

            {custom && captureCountdown !== null ? (
              <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/35">
                <div className="grid h-28 w-28 place-items-center border-4 border-accent bg-black/80">
                  <span className="font-mono text-6xl font-bold text-accent">{captureCountdown}</span>
                </div>
              </div>
            ) : null}
            {custom && captureRecording ? (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
                <div className="border border-accent bg-black/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-accent">
                  Recording motion — do the full gesture now
                </div>
              </div>
            ) : null}

            <HoldRing
              ringRef={ringRef}
              dwellMs={runtime.combo ? Math.max(dwellMs, 500) : dwellMs}
              repeatWaitMs={runtime.repeatWaitMs}
              armed={Boolean(sign)}
            />

            <p className="label pointer-events-none absolute bottom-4 right-4 z-10 hidden bg-black/50 px-2 py-1 !text-[8px] backdrop-blur sm:block">
              {custom
                ? "custom gestures · this tab only"
                : alphabetMode
                  ? alphabetModel === "pretrained"
                    ? "ASL fingerspelling · pretrained MLP (CC BY-NC)"
                    : "ASL fingerspelling + Wow pose · dataset kNN"
                  : numberMode
                    ? "ASL numbers · 1–10"
                    : "starter gestures · not sign language"}
            </p>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 px-3 py-2.5 sm:px-4">
        <p className="text-xs text-white/50">
          {words
            ? "Always recording — sign ASL words one after another. 250-word vocabulary, and it can be wrong."
            : custom
              ? "Click Capture, wait for the 3-second countdown, then perform the full gesture motion (1 or 2 hands, ~2s recorded). Works only in Custom mode."
              : alphabetMode
                ? "Hold one static ASL letter pose until the ring fills. Nothing is stored or uploaded."
                : numberMode
                  ? "Hold one static ASL number pose until the ring fills. Nothing is stored or uploaded."
                  : "Hold a pose for the ring to fill. One hand, or a matching pair. Nothing is stored or uploaded."}
        </p>
        <p className="label !text-[9px]">
          {words
            ? "asl-signs · 250 words · always on"
            : custom
              ? `custom gestures · ${customGestures.length} saved · Custom mode only`
              : knnAlphabet
                ? "ASL alphabet · static A–Z poses + Wow · keys A–Z"
                : alphabetMode
                  ? "ASL alphabet · static A–Z poses · keys A–Z"
                  : numberMode
                    ? "ASL numbers · static 1–10 handshapes"
                    : "keys 1–9 = phrases"}
        </p>
      </div>
    </PixelPanel>
  );
}

function AslOverlay({
  handsVisible,
  message,
  guesses,
}: {
  handsVisible: number;
  message: string;
  guesses: WordGuess[] | null;
}) {
  return (
    <>
      <div className="absolute left-2 top-2 z-10 sm:left-4 sm:top-4">
        <span className="label flex items-center gap-2 bg-black/60 px-2 py-1 !text-[9px] backdrop-blur">
          <span
            className={cn("h-1.5 w-1.5 rounded-full", handsVisible > 0 ? "bg-emerald-400" : "bg-white/40")}
          />
          {handsVisible === 0
            ? "searching for hands"
            : `${handsVisible} hand${handsVisible > 1 ? "s" : ""} detected`}
        </span>
        <span className="label mt-1.5 flex items-center gap-1.5 bg-black/60 px-2 py-1 !text-[9px] !text-accent backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-dot" /> recording
        </span>
      </div>

      <div className="absolute right-2 top-2 z-10 w-[11rem] space-y-1.5 sm:right-4 sm:top-4 sm:w-[13rem] border border-white/30 bg-black/70 px-3 py-2 backdrop-blur">
        <p className="label !text-[8px]">
          live top 3
        </p>
        {guesses
          ? guesses.map((guess, index) => (
              <div key={guess.gloss} className="block w-full text-left">
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("text-xs", index === 0 ? "font-medium text-white" : "text-white/60")}>
                    {guess.gloss}
                  </span>
                  <span className="label !text-[8px]">{Math.round(guess.probability * 100)}%</span>
                </span>
                <span className="mt-1 block h-1 w-full bg-white/15">
                  <span
                    className="block h-full bg-accent"
                    style={{ width: `${Math.round(guess.probability * 100)}%` }}
                  />
                </span>
              </div>
            ))
          : null}
        <p className="text-[10px] leading-snug text-white/50">{message}</p>
      </div>

      <p className="label pointer-events-none absolute bottom-4 right-4 z-10 hidden bg-black/50 px-2 py-1 !text-[8px] backdrop-blur sm:block">
        asl-signs model · 250 words · may be wrong
      </p>
    </>
  );
}
