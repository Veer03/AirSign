"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Hand,
  LoaderCircle,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CaptureStatus, SignCameraProps } from "@/lib/contracts";
import { REQUEST_CAPTURE_EVENT } from "@/lib/events";
import { mockCapture } from "@/lib/mock-signs";
import { cameraErrorMessage, startCamera, stopCamera } from "@/engine/camera";
import { CaptureBuffer } from "@/engine/capture";
import { createGestureRecognizer, type GestureRecognizerResult } from "@/engine/gesture-recognizer";
import type { GestureRecognizer } from "@mediapipe/tasks-vision";
import { normalizeHandFrame } from "@/engine/normalize";

const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15],
  [15, 16], [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17],
];

const GESTURE_NAMES: Record<string, string> = {
  Closed_Fist: "Closed fist",
  Open_Palm: "Open palm",
  Pointing_Up: "Pointing up",
  Thumb_Down: "Thumb down",
  Thumb_Up: "Thumb up",
  Victory: "Victory handshape",
  ILoveYou: "I-love-you handshape",
};

type GesturePrediction = { name: string; confidence: number; hand: string };

function readGesturePredictions(result: GestureRecognizerResult | null): GesturePrediction[] {
  if (!result) return [];
  return result.gestures.flatMap((categories, index) => {
    const category = categories[0];
    if (!category || category.categoryName === "None" || category.score < 0.55) return [];
    return [{
      name: GESTURE_NAMES[category.categoryName] ?? category.categoryName.replaceAll("_", " "),
      confidence: category.score,
      hand: result.handedness[index]?.[0]?.categoryName ?? `Hand ${index + 1}`,
    }];
  });
}

function drawHands(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  result: GestureRecognizerResult | null,
) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  if (!result || !video.videoWidth || !video.videoHeight) return;

  const scale = Math.max(rect.width / video.videoWidth, rect.height / video.videoHeight);
  const offsetX = (rect.width - video.videoWidth * scale) / 2;
  const offsetY = (rect.height - video.videoHeight * scale) / 2;
  const point = (index: number, handIndex: number) => {
    const landmark = result.landmarks[handIndex][index];
    return {
      x: offsetX + landmark.x * video.videoWidth * scale,
      y: offsetY + landmark.y * video.videoHeight * scale,
    };
  };

  result.landmarks.forEach((hand, handIndex) => {
    if (hand.length < 21) return;
    context.save();
    context.strokeStyle = "#22d3ee";
    context.fillStyle = "#22d3ee";
    context.lineWidth = Math.max(2, rect.width / 360);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = "rgba(34, 211, 238, .72)";
    context.shadowBlur = 9;
    for (const [from, to] of BONES) {
      const a = point(from, handIndex);
      const b = point(to, handIndex);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
    hand.forEach((_, index) => {
      const joint = point(index, handIndex);
      context.beginPath();
      context.arc(joint.x, joint.y, index === 0 ? 4 : 2.7, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  });
}

export function SignCamera({ context, captureMs, enabled, onCapture, onStatus }: SignCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const latestResultRef = useRef<GestureRecognizerResult | null>(null);
  const bufferRef = useRef(new CaptureBuffer());
  const rafRef = useRef<number | null>(null);
  const captureStartedRef = useRef<number | null>(null);
  const lastProgressAtRef = useRef(0);
  const mockIndexRef = useRef(0);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [message, setMessage] = useState("");
  const [handCount, setHandCount] = useState(0);
  const [predictions, setPredictions] = useState<GesturePrediction[]>([]);
  const [fps, setFps] = useState(0);
  const [progress, setProgress] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => onStatus?.(status), [onStatus, status]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    captureStartedRef.current = null;
    setCapturing(false);
    setProgress(0);
    recognizerRef.current?.close();
    recognizerRef.current = null;
    stopCamera(videoRef.current, streamRef.current);
    streamRef.current = null;
    latestResultRef.current = null;
    setHandCount(0);
    setPredictions([]);
    setFps(0);
    setStatus("idle");
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (!enabled || status === "starting" || streamRef.current) return;
    setMessage("");
    setStatus("starting");
    try {
      const video = videoRef.current;
      if (!video) throw new Error("The camera preview is not ready. Refresh and try again.");
      streamRef.current = await startCamera(video);
      recognizerRef.current = await createGestureRecognizer();
      bufferRef.current.clear();
      setStatus("watching");
    } catch (error) {
      stopCamera(videoRef.current, streamRef.current);
      streamRef.current = null;
      recognizerRef.current?.close();
      recognizerRef.current = null;
      const cameraError = cameraErrorMessage(error);
      setMessage(cameraError.message);
      setStatus(cameraError.denied ? "denied" : "error");
    }
  }, [enabled, status]);

  useEffect(() => {
    if (!streamRef.current || !recognizerRef.current || status === "idle") return;
    let cancelled = false;
    let frameNumber = 0;
    let framesThisSecond = 0;
    let fpsWindowStart = performance.now();
    let lastUiUpdate = 0;
    let lastVideoTime = -1;

    const tick = (now: number) => {
      if (cancelled) return;
      const video = videoRef.current;
      const recognizer = recognizerRef.current;
      if (video && recognizer && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          frameNumber += 1;
          if (frameNumber % 2 === 0) {
            latestResultRef.current = recognizer.recognizeForVideo(video, now);
            framesThisSecond += 1;
            if (captureStartedRef.current !== null) {
              const result = latestResultRef.current;
              const labels = result.handedness.map((categories) => categories[0]?.categoryName ?? "");
              bufferRef.current.push({
                at: now,
                hands: result.landmarks.length,
                values: normalizeHandFrame(result.landmarks, labels),
              });
            }
          }
        }

        drawHands(canvasRef.current!, video, latestResultRef.current);
        if (now - lastUiUpdate > 250) {
          setHandCount(latestResultRef.current?.landmarks.length ?? 0);
          setPredictions(readGesturePredictions(latestResultRef.current));
          lastUiUpdate = now;
        }
        if (now - fpsWindowStart >= 1000) {
          setFps(framesThisSecond);
          framesThisSecond = 0;
          fpsWindowStart = now;
        }
      }

      const startedAt = captureStartedRef.current;
      if (startedAt !== null) {
        const elapsed = now - startedAt;
        if (now - lastProgressAtRef.current >= 70 || elapsed >= captureMs) {
          setProgress(Math.min(1, elapsed / captureMs));
          lastProgressAtRef.current = now;
        }
        if (elapsed >= captureMs) {
          captureStartedRef.current = null;
          setCapturing(false);
          setProgress(0);
          setCooldown(true);
          setTimeout(() => setCooldown(false), 600);
          const capture = bufferRef.current.toSignCapture(context, elapsed);
          bufferRef.current.clear();
          if (capture.frames) {
            setMessage("Landmarks captured. The classifier above reports general handshapes; the ASL vocabulary model is next.");
            onCapture(capture);
          } else {
            setMessage("No hand was detected during that capture. Move your hand into the frame and try again.");
          }
          setStatus("watching");
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [captureMs, context, onCapture, status]);

  const beginCapture = useCallback(() => {
    if (status !== "watching" || capturing || cooldown) return;
    setMessage("");
    bufferRef.current.clear();
    captureStartedRef.current = performance.now();
    lastProgressAtRef.current = 0;
    setCapturing(true);
    setStatus("capturing");
  }, [cooldown, capturing, status]);

  const cancelCapture = useCallback(() => {
    captureStartedRef.current = null;
    bufferRef.current.clear();
    setCapturing(false);
    setProgress(0);
    setMessage("Capture cancelled. The camera is still tracking your hands.");
    setStatus("watching");
  }, []);

  // Re-entering capturing changes status; the tracking loop remains active.
  useEffect(() => {
    if (status === "capturing" && captureStartedRef.current === null) {
      captureStartedRef.current = performance.now();
    }
  }, [status]);

  useEffect(() => {
    const onSpaceCapture = () => beginCapture();
    window.addEventListener(REQUEST_CAPTURE_EVENT, onSpaceCapture);
    return () => window.removeEventListener(REQUEST_CAPTURE_EVENT, onSpaceCapture);
  }, [beginCapture]);

  const useDemoCapture = useCallback(() => {
    setMessage("Typed demo capture used. This does not contain camera data.");
    onCapture(mockCapture(context, mockIndexRef.current++, captureMs));
  }, [captureMs, context, onCapture]);

  const startLabel = status === "starting"
    ? "Loading camera and hand tracker…"
    : status === "denied"
      ? "Camera permission blocked"
      : status === "error"
        ? "Camera unavailable"
        : "Camera off";

  return (
    <section aria-labelledby="camera-heading" className="panel flex h-full flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--accent)]"><Hand className="size-4" aria-hidden="true" /></span>
          <div>
            <h2 id="camera-heading" className="text-sm font-semibold">Live hand tracking</h2>
            <p className="text-xs text-muted-foreground">Up to two hands · local gesture classifier</p>
          </div>
        </div>
        <Badge variant="outline" className={status === "watching" || status === "capturing" ? "border-[color-mix(in_srgb,var(--success)_45%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]" : "border-[var(--border)] text-muted-foreground"}>
          {status === "starting" ? <LoaderCircle className="size-3 animate-spin" aria-hidden="true" /> : status === "watching" || status === "capturing" ? <span className="size-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" /> : <CameraOff className="size-3" aria-hidden="true" />}
          {status === "watching" || status === "capturing" ? `${handCount} ${handCount === 1 ? "hand" : "hands"} · ${fps} fps` : status === "starting" ? "Starting" : "Camera paused"}
        </Badge>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]" style={{ aspectRatio: "4 / 3" }}>
        <video ref={videoRef} muted playsInline className="absolute inset-0 size-full scale-x-[-1] object-cover" aria-label="Live camera preview" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full scale-x-[-1]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-3" aria-hidden="true">
          <span className="absolute left-0 top-0 size-5 border-l-2 border-t-2 border-[var(--accent)] opacity-60" />
          <span className="absolute right-0 top-0 size-5 border-r-2 border-t-2 border-[var(--accent)] opacity-60" />
          <span className="absolute bottom-0 left-0 size-5 border-b-2 border-l-2 border-[var(--accent)] opacity-60" />
          <span className="absolute bottom-0 right-0 size-5 border-b-2 border-r-2 border-[var(--accent)] opacity-60" />
        </div>
        {status === "idle" || status === "starting" || status === "denied" || status === "error" ? (
          <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] p-6 text-center">
            <div className="max-w-sm space-y-3">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
                {status === "starting" ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : status === "error" ? <AlertTriangle className="size-5" aria-hidden="true" /> : <Camera className="size-5" aria-hidden="true" />}
              </span>
              <p className="text-sm font-semibold">{startLabel}</p>
              {message ? <p role="status" className="text-xs leading-relaxed text-muted-foreground">{message}</p> : <p className="text-xs leading-relaxed text-muted-foreground">Your video stays in this browser. AirSign uses it only to find hand landmarks.</p>}
              {status !== "starting" ? <Button size="sm" onClick={() => void start()} disabled={!enabled}><Camera aria-hidden="true" />{status === "idle" ? "Start camera" : "Try camera again"}</Button> : null}
            </div>
          </div>
        ) : null}
        {status === "watching" && handCount === 0 ? <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] px-3 py-1 text-xs text-muted-foreground">Show one or both hands in the frame</div> : null}
        {capturing ? <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--surface)]"><div className="h-full bg-[var(--accent)] transition-[width] duration-75" style={{ width: `${Math.round(progress * 100)}%` }} /></div> : null}
        {(status === "watching" || status === "capturing") ? <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] px-2.5 py-1.5 text-[11px] text-muted-foreground backdrop-blur"><span>Video stays on this device</span><span>{handCount} / 2 hands</span></div> : null}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-[var(--success)]" aria-hidden="true" /><span>On-device gesture predictions</span></div>
          <span className="text-xs tabular-nums text-muted-foreground">{Math.round(captureMs / 100) / 10}s capture</span>
        </div>
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/70 p-3" aria-live="polite">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Live classifier</p>
          {predictions.length ? (
            <ul className="mt-2 space-y-2">
              {predictions.map((prediction) => (
                <li key={`${prediction.hand}-${prediction.name}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{prediction.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{prediction.hand} hand</span></span>
                  <span className="text-xs tabular-nums text-muted-foreground">{Math.round(prediction.confidence * 100)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{status === "watching" || status === "capturing" ? "No supported handshape above the confidence threshold yet." : "Start the camera to see live predictions."}</p>
          )}
        </div>
        {status === "watching" || status === "capturing" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {capturing ? <Button onClick={cancelCapture} variant="outline"><X aria-hidden="true" />Cancel capture</Button> : <Button onClick={beginCapture} disabled={status !== "watching" || cooldown}><Hand aria-hidden="true" />{cooldown ? "Ready shortly…" : "Capture hand movement"}</Button>}
            {!capturing ? <Button variant="outline" onClick={stop}><CameraOff aria-hidden="true" />Stop camera</Button> : null}
          </div>
        ) : null}
        {status === "idle" || status === "denied" || status === "error" ? <Button className="mt-3" variant="outline" onClick={useDemoCapture}><Play aria-hidden="true" />Use typed demo capture</Button> : null}
        {message && (status === "watching" || status === "capturing") ? <p role="status" className="mt-3 text-xs leading-relaxed text-muted-foreground">{message}</p> : null}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">The starter model classifies seven general handshapes. It does not classify ASL words yet.</p>
      </div>
    </section>
  );
}
