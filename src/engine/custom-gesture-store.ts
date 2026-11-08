"use client";

import type { Landmark } from "./landmarks";
import { normalizeHandLandmarks } from "./asl-alphabet";
import type { StoredCustomGesture } from "@/lib/storage";

export type CustomGestureMatch = {
  id: string;
  label: string;
  hands: 1 | 2;
  confidence: number;
};

const SAMPLE_FRAMES = 16;
// Specific to the recorded joint pose/motion, but tolerant of natural hand variation/speed.
const ONE_MATCH_DISTANCE = 4.4;
const ONE_CLEAR_DISTANCE = 6.0;
const TWO_MATCH_DISTANCE = 7.0;
const TWO_CLEAR_DISTANCE = 9.0;
const MOTION_MATCH_BONUS = 1.15; // motion gestures get a bit more tolerance
const MAX_FRAME_DISTANCE_MULT = 1.85; // reject only clearly different frames
const STATIC_MOTION = 0.16;
const INPUT_STATIC_MOTION = 0.3;

type Sequence = Float32Array[]; // normalized frames

function cloneHand(points: Landmark[]): Landmark[] {
  return points.map((p) => ({ x: p.x, y: p.y, z: p.z }));
}

function sortHands(hands: Landmark[][]): Landmark[][] {
  return [...hands].sort((a, b) => (a[0]?.x ?? 0) - (b[0]?.x ?? 0)).map(cloneHand);
}

function normalizeOneHand(points: Landmark[] | null | undefined, mirror: boolean): Float32Array | null {
  if (!points || points.length < 21) return null;
  return normalizeHandLandmarks(points, mirror);
}

function normalizeTwoHands(hands: Landmark[][], mirror: boolean): Float32Array | null {
  if (hands.length < 2) return null;
  const ordered = sortHands(hands).slice(0, 2);
  let left = ordered[0];
  let right = ordered[1];
  if (mirror) {
    left = ordered[1];
    right = ordered[0];
  }
  const a = normalizeOneHand(left, mirror);
  const b = normalizeOneHand(right, mirror);
  if (!a || b == null) return null;
  const out = new Float32Array(126);
  out.set(a, 0);
  out.set(b, 63);
  return out;
}

function normalizeFrameHands(hands: Landmark[][], mirror: boolean): Float32Array | null {
  if (!hands || hands.length === 0) return null;
  if (hands.length === 1) return normalizeOneHand(hands[0], mirror);
  return normalizeTwoHands(hands, mirror);
}

function resampleSequence(frames: Float32Array[], count: number): Float32Array[] {
  if (frames.length === 0) return [];
  if (frames.length === 1) return Array.from({ length: count }, () => new Float32Array(frames[0]));
  const out: Float32Array[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = (i * (frames.length - 1)) / Math.max(1, count - 1);
    const idx = Math.round(t);
    out.push(new Float32Array(frames[Math.min(frames.length - 1, Math.max(0, idx))]));
  }
  return out;
}

function normalizeRecordedFrames(frames: Landmark[][][], mirror: boolean): Sequence | null {
  const normalized = frames
    .map((hands) => normalizeFrameHands(hands, mirror))
    .filter((frame): frame is Float32Array => frame !== null);
  if (normalized.length === 0) return null;
  // Capture hands count is defined by the modal frame.
  const modalLen = normalized
    .map((f) => f.length)
    .sort((a, b) =>
      normalized.filter((f) => f.length === a).length - normalized.filter((f) => f.length === b).length,
    )[normalized.length - 1];
  const filtered = normalized.filter((f) => f.length === modalLen);
  if (filtered.length === 0) return null;
  return resampleSequence(filtered, SAMPLE_FRAMES);
}

function motionAmount(sequence: Sequence): number {
  if (sequence.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < sequence.length; i += 1) {
    const a = sequence[i - 1];
    const b = sequence[i];
    let d = 0;
    for (let j = 0; j < a.length && j < b.length; j += 1) {
      const delta = a[j] - b[j];
      d += delta * delta;
    }
    total += Math.sqrt(d);
  }
  return total / (sequence.length - 1);
}

function sequenceDistance(a: Sequence, b: Sequence): { avg: number; max: number } {
  if (a.length === 0 || b.length === 0) return { avg: Number.POSITIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  if (a[0].length !== b[0].length) return { avg: Number.POSITIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  let total = 0;
  let max = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    let d = 0;
    for (let j = 0; j < x.length; j += 1) {
      const delta = x[j] - y[j];
      d += delta * delta;
    }
    const frame = Math.sqrt(d);
    total += frame;
    if (frame > max) max = frame;
  }
  return { avg: total / a.length, max };
}

function storedSequence(gesture: StoredCustomGesture): Sequence | null {
  const frames = (gesture.frames || [])
    .map((frame) => Float32Array.from(frame.filter((v) => typeof v === "number" && Number.isFinite(v))))
    .filter((frame) => frame.length === 63 || frame.length === 126);
  if (frames.length === 0) return null;
  const hands: 1 | 2 = gesture.hands === 2 || frames[0].length === 126 ? 2 : 1;
  const want = hands === 2 ? 126 : 63;
  const filtered = frames.filter((f) => f.length === want);
  if (filtered.length === 0) return null;
  return resampleSequence(filtered, SAMPLE_FRAMES);
}

/** Classify a recorded/rolling window of frames (each frame: 1 or 2 hands). */
export function classifyCustomGesture(
  frameHands: Landmark[][][],
  gestures: StoredCustomGesture[],
): CustomGestureMatch | null {
  if (!frameHands || frameHands.length === 0 || gestures.length === 0) return null;
  const normal = normalizeRecordedFrames(frameHands, false);
  const mirrored = normalizeRecordedFrames(frameHands, true);
  if (!normal && !mirrored) return null;
  const candidates = [normal, mirrored].filter((s): s is Sequence => s !== null);
  const inputHands: 1 | 2 = candidates[0][0].length === 126 ? 2 : 1;
  const inputMotion = Math.max(...candidates.map(motionAmount));

  let best: (CustomGestureMatch & { avg: number; max: number }) | null = null;
  for (const gesture of gestures) {
    const sample = storedSequence(gesture);
    if (!sample) continue;
    const gestureHands: 1 | 2 = gesture.hands === 2 || sample[0].length === 126 ? 2 : 1;
    if (gestureHands !== inputHands) continue;
    const sampleMotion = motionAmount(sample);

    let chosen: { avg: number; max: number } | null = null;
    for (const candidate of candidates) {
      if (candidate[0].length !== sample[0].length) continue;
      // Static captures require a near-static live pose to avoid matching random mid-motion hands.
      if (sampleMotion <= STATIC_MOTION && motionAmount(candidate) > INPUT_STATIC_MOTION) continue;

      if (sampleMotion > STATIC_MOTION) {
        // Motion gestures: find the best-matching temporal segment in the rolling window
        // so the gesture can be performed slightly faster/slower or sit within a larger window.
        const segLen = Math.min(sample.length, candidate.length);
        const maxStart = Math.max(0, candidate.length - segLen);
        for (let start = 0; start <= maxStart; start += 1) {
          const aligned = candidate.length === segLen && start === 0 ? candidate : candidate.slice(start, start + segLen);
          const target = sample.length === segLen ? sample : resampleSequence(sample, segLen);
          if (aligned.length !== target.length) continue;
          const d = sequenceDistance(aligned, target);
          if (!chosen || d.avg < chosen.avg) chosen = d;
        }
      } else {
        const d = sequenceDistance(candidate, sample);
        if (!chosen || d.avg < chosen.avg) chosen = d;
      }
    }
    if (!chosen || !Number.isFinite(chosen.avg)) continue;
    if (!best || chosen.avg < best.avg) {
      best = { id: gesture.id, label: gesture.label, hands: gestureHands, confidence: 0, avg: chosen.avg, max: chosen.max };
    }
  }

  const matchDistance = inputHands === 2 ? TWO_MATCH_DISTANCE : ONE_MATCH_DISTANCE;
  const clearDistance = inputHands === 2 ? TWO_CLEAR_DISTANCE : ONE_CLEAR_DISTANCE;
  if (!best) return null;
  const bestStored = gestures.find((g) => g.id === best!.id) ?? null;
  const bestSample = bestStored ? storedSequence(bestStored) : null;
  const bestIsMotion = Boolean(bestSample && motionAmount(bestSample) > STATIC_MOTION);
  const limit = bestIsMotion ? matchDistance * MOTION_MATCH_BONUS : matchDistance;
  if (best.avg > limit) return null;
  if (best.max > limit * MAX_FRAME_DISTANCE_MULT) return null;

  // Motion gestures should not fire on a static pose.
  if (bestIsMotion && inputMotion < 0.1) return null;

  const confidence = Math.max(
    0.55,
    Math.min(0.99, 1 - best.avg / (bestIsMotion ? clearDistance * MOTION_MATCH_BONUS : clearDistance)),
  );
  return { id: best.id, label: best.label, hands: best.hands, confidence };
}