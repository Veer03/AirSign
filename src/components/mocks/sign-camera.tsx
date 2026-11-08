"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CameraOff,
  Hand,
  Play,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
  Candidate,
  CaptureStatus,
  SignCameraProps,
  SignCapture,
} from "@/lib/contracts";
import { REQUEST_CAPTURE_EVENT } from "@/lib/events";
import { mockCapture } from "@/lib/mock-signs";

type DemoStatus = "live" | "denied" | "error";

const LANDMARKS: [number, number][] = [
  [100, 202],
  [74, 176],
  [56, 152],
  [48, 128],
  [44, 108],
  [78, 126],
  [76, 96],
  [75, 70],
  [74, 48],
  [100, 120],
  [100, 88],
  [100, 62],
  [100, 40],
  [122, 124],
  [126, 94],
  [128, 68],
  [130, 48],
  [142, 136],
  [150, 110],
  [154, 88],
  [158, 70],
];

const BONES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

export function HandLandmarks({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 200 220"
      className="h-full w-full max-h-[280px]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="airsign-landmark"
          x1="40"
          y1="40"
          x2="160"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
        <radialGradient id="airsign-joint" cx="50%" cy="50%" r="50%">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </radialGradient>
      </defs>

      <g
        stroke="url(#airsign-landmark)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={active ? 0.9 : 0.45}
      >
        {BONES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={LANDMARKS[a][0]}
            y1={LANDMARKS[a][1]}
            x2={LANDMARKS[b][0]}
            y2={LANDMARKS[b][1]}
          />
        ))}
      </g>

      <g fill="url(#airsign-joint)">
        {LANDMARKS.map(([x, y], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={index === 0 ? 5 : 3.2}
            opacity={active ? 0.95 : 0.5}
          >
            {active ? (
              <animate
                attributeName="opacity"
                values="0.45;1;0.45"
                dur={`${2.4 + (index % 5) * 0.35}s`}
                repeatCount="indefinite"
              />
            ) : null}
          </circle>
        ))}
      </g>

      <g fill="var(--amber)" opacity={active ? 0.9 : 0.4}>
        <circle cx="44" cy="108" r="4" />
        <circle cx="74" cy="48" r="4" />
        <circle cx="100" cy="40" r="4" />
        <circle cx="130" cy="48" r="4" />
        <circle cx="158" cy="70" r="4" />
      </g>
    </svg>
  );
}

export function SignCamera({
  context,
  captureMs,
  enabled,
  onCapture,
  onStatus,
}: SignCameraProps) {
  const [demoStatus, setDemoStatus] = useState<DemoStatus>("live");
  const [progress, setProgress] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const indexRef = useRef(0);

  const active = enabled && !paused && demoStatus === "live";

  const cancelCapture = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setProgress(null);
  }, []);

  const startCapture = useCallback(() => {
    if (!active || progress !== null) return;

    cancelCapture();
    const duration = Math.max(1200, captureMs);
    const startedAt = performance.now();
    setProgress(0);

    const tick = (now: number) => {
      const value = Math.min(1, (now - startedAt) / duration);
      setProgress(value);

      if (value < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = null;
      setProgress(null);

      const capture: SignCapture = mockCapture(
        context,
        indexRef.current,
        duration,
      );
      indexRef.current += 1;
      setCandidates(capture.candidates);
      onCapture(capture);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [active, cancelCapture, captureMs, context, onCapture, progress]);

  useEffect(() => {
    const handler = () => startCapture();
    window.addEventListener(REQUEST_CAPTURE_EVENT, handler);
    return () => window.removeEventListener(REQUEST_CAPTURE_EVENT, handler);
  }, [startCapture]);

  useEffect(() => cancelCapture, [cancelCapture]);

  const status: CaptureStatus = !active
    ? demoStatus === "denied"
      ? "denied"
      : demoStatus === "error"
        ? "error"
        : "idle"
    : progress !== null
      ? "capturing"
      : candidates
        ? "ready"
        : "watching";

  useEffect(() => {
    onStatus?.(status);
  }, [onStatus, status]);

  const top = candidates?.[0];
  const capturing = progress !== null;

  return (
    <section
      aria-labelledby="camera-heading"
      className="panel flex h-full flex-col gap-4 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--accent)]">
            <Hand className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="camera-heading" className="text-sm font-semibold">
              Signer camera
            </h2>
            <p className="text-xs text-muted-foreground">
              Point at the person signing · gist, not translation
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-[color-mix(in_srgb,var(--amber)_45%,transparent)] bg-[color-mix(in_srgb,var(--amber)_12%,transparent)] text-[var(--amber)]"
        >
          <CameraOff className="size-3" aria-hidden="true" />
          Demo mode: camera not connected
        </Badge>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
        style={{ aspectRatio: "4 / 3" }}
      >
        <div className="absolute inset-0 grid-lines opacity-60" aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 64%)",
          }}
          aria-hidden="true"
        />

        <div className="absolute inset-0 grid place-items-center p-8">
          <div className="relative h-full w-full max-w-[260px] animate-breathe">
            <HandLandmarks active={active && !capturing} />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-6 top-6 h-px animate-scan bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-70"
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-3" aria-hidden="true">
          <span className="absolute left-0 top-0 size-5 border-l-2 border-t-2 border-[var(--accent)] opacity-60" />
          <span className="absolute right-0 top-0 size-5 border-r-2 border-t-2 border-[var(--accent)] opacity-60" />
          <span className="absolute bottom-0 left-0 size-5 border-b-2 border-l-2 border-[var(--accent)] opacity-60" />
          <span className="absolute bottom-0 right-0 size-5 border-b-2 border-r-2 border-[var(--accent)] opacity-60" />
        </div>

        {capturing ? (
          <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_55%,transparent)]">
            <div className="relative grid size-44 place-items-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(var(--accent) ${(progress ?? 0) * 360}deg, color-mix(in srgb, var(--text) 10%, transparent) 0deg)`,
                  mask: "radial-gradient(circle, transparent 62%, #000 63%)",
                  WebkitMask: "radial-gradient(circle, transparent 62%, #000 63%)",
                }}
                aria-hidden="true"
              />
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Capturing
                </p>
                <p className="mt-1 text-lg font-semibold">Keep signing</p>
                <p className="text-sm tabular-nums text-[var(--accent)]">
                  {Math.round((progress ?? 0) * 100)}%
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {demoStatus !== "live" ? (
          <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] p-6 text-center">
            <div className="max-w-xs space-y-3">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-[var(--danger)]">
                {demoStatus === "denied" ? (
                  <CameraOff className="size-5" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="size-5" aria-hidden="true" />
                )}
              </span>
              <p className="text-sm font-semibold">
                {demoStatus === "denied"
                  ? "Camera permission denied"
                  : "Camera unavailable"}
              </p>
              <p className="text-xs text-muted-foreground">
                {demoStatus === "denied"
                  ? "In the real build this is where the permission prompt and retry live."
                  : "In the real build this is where the device error and retry live."}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDemoStatus("live")}
              >
                Reset demo state
              </Button>
            </div>
          </div>
        ) : null}

        {!enabled ? (
          <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] p-6 text-center">
            <div className="space-y-2">
              <CameraOff
                className="mx-auto size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold">Camera is off</p>
              <p className="text-xs text-muted-foreground">
                Sign capture is paused. The typed reply still works.
              </p>
            </div>
          </div>
        ) : null}

        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] px-2.5 py-1.5 backdrop-blur">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ScanLine className="size-3 text-[var(--accent)]" aria-hidden="true" />
            {active ? "Watching your hands" : "Not watching"}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {captureMs} ms capture
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>
              {capturing
                ? "Capturing a short burst…"
                : top
                  ? "Last capture read"
                  : "No capture yet"}
            </span>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              cancelCapture();
              setPaused((value) => !value);
            }}
            aria-pressed={paused}
          >
            {paused ? <Play aria-hidden="true" /> : <CameraOff aria-hidden="true" />}
            {paused ? "Resume" : "Pause"}
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">
              {top ? top.label.replaceAll("_", " ") : "Waiting for a sign"}
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {top ? `${Math.round(top.confidence * 100)}% confidence` : "—"}
            </p>
          </div>
          <Progress
            value={top ? Math.round(top.confidence * 100) : 0}
            aria-label="Top candidate confidence"
            className="h-1.5"
          />
          <p className="text-xs text-muted-foreground">
            {capturing
              ? "Keep the sign going until the ring closes."
              : top
                ? "Coarse candidates only. Gemini frames the gist; you confirm it."
                : "Press Capture or Space when the person starts signing."}
          </p>
          {candidates && candidates.length > 1 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {candidates.slice(1).map((candidate) => (
                <span
                  key={candidate.label}
                  className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {candidate.label.replaceAll("_", " ")} ·{" "}
                  {Math.round(candidate.confidence * 100)}%
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <Button
          className="mt-3 w-full"
          onClick={startCapture}
          disabled={!active || capturing}
        >
          <Hand aria-hidden="true" />
          {capturing ? "Capturing…" : "Capture a sign"}
        </Button>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Demo states:</span>
          <button
            type="button"
            onClick={() => {
              cancelCapture();
              setDemoStatus("denied");
            }}
            className="rounded-full border border-[var(--border)] px-2 py-0.5 hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            denied
          </button>
          <button
            type="button"
            onClick={() => {
              cancelCapture();
              setDemoStatus("error");
            }}
            className="rounded-full border border-[var(--border)] px-2 py-0.5 hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            error
          </button>
          {demoStatus !== "live" ? (
            <button
              type="button"
              onClick={() => setDemoStatus("live")}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              reset
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-auto flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        Typed mocks only. No video is captured, stored, or sent anywhere.
      </p>
    </section>
  );
}
