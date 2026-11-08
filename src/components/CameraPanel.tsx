"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, CameraOff, RotateCcw, ShieldCheck } from "lucide-react";
import type { GestureEvent, HandCandidate } from "@/lib/contracts";
import { makeSignEvent } from "@/lib/starter-phrases";
import { useGestures, type SignLock } from "@/engine/useGestures";
import { cn } from "@/lib/utils";
import { HoldRing } from "./HoldRing";
import { PixelPanel } from "./PixelPanel";

type CameraPanelProps = {
  enabled: boolean;
  dwellMs: number;
  /** Wait before the same held signal can speak again. */
  repeatMs: number;
  twoHands: boolean;
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
  onEnable,
  onDisable,
  onLock,
  onRetry,
}: CameraPanelProps & { onRetry: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  const handleLock = useCallback(
    (lock: SignLock) => {
      onLock(makeSignEvent(lock, lock.confidence, "camera"));
    },
    [onLock],
  );

  const runtime = useGestures({
    enabled,
    dwellMs,
    repeatMs,
    twoHands,
    onLock: handleLock,
    videoRef,
    canvasRef,
    stageRef,
    ringRef,
  });

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
          {ready ? <span className="label">{runtime.fps} fps</span> : null}
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
                Show a starter gesture with one hand, or hold a matching pair with both.
                The video stays in this browser — only text is sent to the server.
              </p>
              <button
                type="button"
                onClick={onEnable}
                className="mt-5 inline-flex items-center gap-2 bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:bg-accent-soft"
              >
                <Camera className="h-4 w-4" /> Enable camera
              </button>
              <p className="label mt-4 !text-[9px]">or press keys 1–8</p>
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

        {enabled && ready ? (
          <>
            <div className="absolute left-4 top-4 z-10">
              <span className="label flex items-center gap-2 bg-black/60 px-2 py-1 !text-[9px] backdrop-blur">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    handCount > 0 ? "bg-emerald-400" : "bg-white/40",
                  )}
                />
                {handCount === 0
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
              starter gestures · not sign language
            </p>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 px-4 py-2.5">
        <p className="text-xs text-white/50">
          Hold a pose for the ring to fill. One hand, or a matching pair. Nothing is stored or
          uploaded.
        </p>
        <p className="label !text-[9px]">keys 1–8 = phrases</p>
      </div>
    </PixelPanel>
  );
}
