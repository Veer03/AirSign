"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Hand, RotateCcw, ShieldCheck } from "lucide-react";
import type { GestureEvent, HandCandidate } from "@/lib/contracts";
import { makeSignEvent } from "@/lib/starter-phrases";
import { useGestures, type SignLock } from "@/engine/useGestures";
import { SIGN_KEY, useAslWords } from "@/engine/useAslWords";
import { glossToText, type WordGuess } from "@/engine/asl-classifier";
import { saveDelegate, savedDelegate, type Delegate } from "@/engine/delegate";
import { disposeRecognizer } from "@/engine/recognizer";
import { disposeHolistic } from "@/engine/holistic";
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
  onEnable: () => void;
  onDisable?: () => void;
  onLock: (event: GestureEvent) => void;
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

const MODES = ["starter", "words", "alphabet"] as const;
type Mode = (typeof MODES)[number];
const MODE_LABELS: Record<Mode, string> = { starter: "starter", words: "asl words", alphabet: "alphabet" };

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
  // "alphabet" = Harshpal's kNN letters (page-owned alphabetMode, same
  // GestureRecognizer pipeline as starter). Read the URL after mount so SSR
  // and the client agree.
  const [baseMode, setBaseMode] = useState<"starter" | "words">("starter");
  const mode: Mode = alphabetMode ? "alphabet" : baseMode;
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("mode");
    if (fromUrl === "words") setBaseMode("words");
    if (fromUrl === "alphabet") onAlphabetModeChange?.(true);
    // Mount only: the URL seeds the initial mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const switchMode = useCallback(
    (next: Mode) => {
      if (next === "alphabet") {
        onAlphabetModeChange?.(true);
      } else {
        onAlphabetModeChange?.(false);
        setBaseMode(next);
      }
    },
    [onAlphabetModeChange],
  );
  // Keep ?mode= in sync, including when the page's "ASL A–Z" button flips it.
  // Skip the first run so it can't erase the URL before the mount read applies.
  const firstUrlSync = useRef(true);
  useEffect(() => {
    if (firstUrlSync.current) {
      firstUrlSync.current = false;
      return;
    }
    const url = new URL(window.location.href);
    if (mode === "starter") url.searchParams.delete("mode");
    else url.searchParams.set("mode", mode);
    window.history.replaceState(null, "", url);
  }, [mode]);
  const words = mode === "words";

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

  const asl = useAslWords({ enabled: enabled && words, videoRef, canvasRef, onWord: handleWord });

  const starterRuntime = useGestures({
    enabled: enabled && !words,
    dwellMs,
    repeatMs,
    twoHands,
    alphabetMode,
    onLock: handleLock,
    videoRef,
    canvasRef,
    stageRef,
    ringRef,
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

  return (
    <PixelPanel className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-2.5">
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
        <div className="flex items-center gap-3">
          <div className="flex border border-white/25" role="group" aria-label="Recognition mode">
            {MODES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => switchMode(value)}
                className={cn(
                  "label px-2 py-1 transition",
                  mode === value ? "bg-white/15 !text-white" : "hover:!text-white",
                )}
              >
                {MODE_LABELS[value]}
              </button>
            ))}
          </div>
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
                  className={cn("label px-2 py-1 transition", active ? "bg-white/15 !text-white" : "hover:!text-white")}
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
              className="label flex items-center gap-1 border border-white/25 px-2 py-1 transition hover:border-white/60 hover:text-white"
            >
              <CameraOff className="h-3 w-3" /> stop
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <div className="absolute inset-0 overflow-hidden">
          <div
            ref={stageRef}
            className="absolute inset-0"
            style={{ transformOrigin: "0 0", willChange: "transform" }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
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
                {alphabetMode
                  ? "Show one static ASL alphabet letter, or press its A–Z key."
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
                {alphabetMode ? "A–Z keys also work" : "or press keys 1–9"}
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
            recording={asl.runtime.recording}
            message={asl.runtime.message}
            guesses={asl.runtime.guesses}
            unsure={asl.runtime.unsure}
            continuous={asl.runtime.continuous}
            onToggleContinuous={() => asl.setContinuous(!asl.runtime.continuous)}
            onBegin={asl.beginSign}
            onEnd={() => void asl.endSign()}
            onPick={asl.pickGuess}
          />
        ) : null}

        {enabled && ready && !words ? (
          <>
            <div className="absolute left-4 top-4 z-10">
              <span className="label flex items-center gap-2 bg-black/60 px-2 py-1 !text-[9px] backdrop-blur">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    handCount > 0 ? "bg-emerald-400" : "bg-white/40",
                  )}
                />
                {alphabetMode
                  ? handCount === 0
                    ? "show one hand"
                    : "ASL alphabet hand"
                  : handCount === 0
                    ? "searching for hands"
                    : handCount === 1
                      ? "1 hand detected"
                      : `${handCount} hands detected`}
              </span>
            </div>

            {handCount > 0 ? (
              <div className="absolute right-4 top-4 z-10 min-w-[10rem] space-y-1.5 border border-white/30 bg-black/70 px-3 py-2 backdrop-blur">
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

            <HoldRing
              ringRef={ringRef}
              dwellMs={runtime.combo ? Math.max(dwellMs, 500) : dwellMs}
              repeatWaitMs={runtime.repeatWaitMs}
              armed={Boolean(sign)}
            />

            <p className="label pointer-events-none absolute bottom-4 right-4 z-10 hidden bg-black/50 px-2 py-1 !text-[8px] backdrop-blur sm:block">
              {alphabetMode ? "ASL fingerspelling · letters only" : "starter gestures · not sign language"}
            </p>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 px-4 py-2.5">
        <p className="text-xs text-white/50">
          {words
            ? `Hold ${SIGN_KEY.toUpperCase()} (or the button), sign one ASL word, release. 250-word vocabulary, and it can be wrong.`
            : alphabetMode
              ? "Hold one static ASL letter pose until the ring fills. Nothing is stored or uploaded."
              : "Hold a pose for the ring to fill. One hand, or a matching pair. Nothing is stored or uploaded."}
        </p>
        <p className="label !text-[9px]">
          {words
            ? `hold ${SIGN_KEY} = sign`
            : alphabetMode
              ? "ASL alphabet · static A–Z poses · keys A–Z"
              : "keys 1–9 = phrases"}
        </p>
      </div>
    </PixelPanel>
  );
}

function AslOverlay({
  handsVisible,
  recording,
  message,
  guesses,
  unsure,
  continuous,
  onToggleContinuous,
  onBegin,
  onEnd,
  onPick,
}: {
  handsVisible: number;
  recording: boolean;
  message: string;
  guesses: WordGuess[] | null;
  unsure: boolean;
  continuous: boolean;
  onToggleContinuous: () => void;
  onBegin: () => void;
  onEnd: () => void;
  onPick: (guess: WordGuess) => void;
}) {
  return (
    <>
      <div className="absolute left-4 top-4 z-10">
        <span className="label flex items-center gap-2 bg-black/60 px-2 py-1 !text-[9px] backdrop-blur">
          <span
            className={cn("h-1.5 w-1.5 rounded-full", handsVisible > 0 ? "bg-emerald-400" : "bg-white/40")}
          />
          {handsVisible === 0
            ? "searching for hands"
            : `${handsVisible} hand${handsVisible > 1 ? "s" : ""} detected`}
        </span>
      </div>

      <div className="absolute right-4 top-4 z-10 w-[13rem] space-y-1.5 border border-white/30 bg-black/70 px-3 py-2 backdrop-blur">
        <p className="label !text-[8px]">
          {unsure ? "not sure — pick one" : continuous ? "continuous · live top 3" : "asl word · top 3"}
        </p>
        {guesses
          ? guesses.map((guess, index) => (
              <button
                key={guess.gloss}
                type="button"
                disabled={!unsure}
                onClick={() => onPick(guess)}
                className={cn(
                  "block w-full text-left",
                  unsure && "border border-amber-400/50 px-1.5 py-1 hover:border-amber-300",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("text-xs", index === 0 ? "font-medium text-white" : "text-white/60")}>
                    {guess.gloss}
                  </span>
                  <span className="label !text-[8px]">{Math.round(guess.probability * 100)}%</span>
                </span>
                <span className="mt-1 block h-1 w-full bg-white/15">
                  <span
                    className={cn("block h-full", unsure ? "bg-amber-400" : "bg-accent")}
                    style={{ width: `${Math.round(guess.probability * 100)}%` }}
                  />
                </span>
              </button>
            ))
          : null}
        <p className="text-[10px] leading-snug text-white/50">{message}</p>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {continuous ? null : (
          <button
            type="button"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              onBegin();
            }}
            onPointerUp={onEnd}
            onPointerCancel={onEnd}
            className={cn(
              "inline-flex select-none items-center gap-2 whitespace-nowrap px-5 py-2.5 text-sm font-medium transition",
              recording
                ? "bg-accent text-black"
                : "border border-white/50 bg-black/60 text-white hover:border-white",
            )}
          >
            <Hand className="h-4 w-4" />
            {recording ? "Signing… release" : `Hold to sign (${SIGN_KEY.toUpperCase()})`}
          </button>
        )}
        <button
          type="button"
          aria-pressed={continuous}
          onClick={onToggleContinuous}
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition",
            continuous
              ? "bg-accent text-black"
              : "border border-white/50 bg-black/60 text-white hover:border-white",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", continuous ? "bg-black pulse-dot" : "bg-white/50")} />
          {continuous ? "Continuous on — stop" : "Continuous"}
        </button>
      </div>

      <p className="label pointer-events-none absolute bottom-4 right-4 z-10 hidden bg-black/50 px-2 py-1 !text-[8px] backdrop-blur sm:block">
        asl-signs model · 250 words · may be wrong
      </p>
    </>
  );
}
