"use client";

import type { Landmark } from "./landmarks";
import { normalizeCustomGestureHand } from "./asl-alphabet";
import type { StoredCustomGesture } from "@/lib/storage";

export type CustomGestureMatch = {
  id: string;
  label: string;
  hands: 1 | 2;
  confidence: number;
};

const SAMPLE_FRAMES = 16;
// Scores scale against these clear-match distances; the Custom panel lets the
// user choose how much confidence is required before a match can trigger.
const ONE_CLEAR_DISTANCE = 3.2;
const TWO_CLEAR_DISTANCE = 4.5;
const MOTION_MATCH_BONUS = 1.15; // motion gestures get a bit more tolerance
const MAX_FRAME_DISTANCE_MULT = 1.85; // reject only clearly different frames
const STATIC_MOTION = 0.16;
const INPUT_STATIC_MOTION = 0.3;
const WRIST_TRAVEL_MOTION = 0.25;

type Sequence = Float32Array[]; // normalized frames

function cloneHand(points: Landmark[]): Landmark[] {
  return points.map((p) => ({ x: p.x, y: p.y, z: p.z }));
}

function sortHands(hands: Landmark[][]): Landmark[][] {
  return [...hands].sort((a, b) => (a[0]?.x ?? 0) - (b[0]?.x ?? 0)).map(cloneHand);
}

function normalizeOneHand(points: Landmark[] | null | undefined, mirror: boolean): Float32Array | null {
  if (!points || points.length < 21) return null;
  return normalizeCustomGestureHand(points, mirror);
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
  // Capture hands count is defined by the modal frame (two-hand frames win ties).
  let oneHand = 0;
  for (const frame of normalized) if (frame.length === 63) oneHand += 1;
  const modalLen = oneHand > normalized.length - oneHand ? 63 : 126;
  const filtered = normalized.filter((f) => f.length === modalLen);
  if (filtered.length === 0) return null;
  return filtered;
}

/** Make camera-space wrist movement relative to the start of this sequence. */
function relativeTrajectory(sequence: Sequence): Sequence {
  if (sequence.length === 0) return sequence;
  const features = sequence[0].length;
  const hands = features === 126 ? 2 : 1;
  const out = sequence.map((frame) => new Float32Array(frame));
  for (let hand = 0; hand < hands; hand += 1) {
    const wrist = hand * 63;
    const startX = sequence[0][wrist];
    const startY = sequence[0][wrist + 1];
    for (const frame of out) {
      frame[wrist] = (frame[wrist] - startX) * 1.5;
      frame[wrist + 1] = (frame[wrist + 1] - startY) * 1.5;
    }
  }
  return out;
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

function wristTravel(sequence: Sequence): number {
  if (sequence.length < 2) return 0;
  const hands = sequence[0].length === 126 ? 2 : 1;
  let total = 0;
  for (let frame = 1; frame < sequence.length; frame += 1) {
    for (let hand = 0; hand < hands; hand += 1) {
      const offset = hand * 63;
      const dx = sequence[frame][offset] - sequence[frame - 1][offset];
      const dy = sequence[frame][offset + 1] - sequence[frame - 1][offset + 1];
      total += Math.hypot(dx, dy);
    }
  }
  return total / hands;
}

function isMotionSequence(sequence: Sequence): boolean {
  return motionAmount(sequence) > STATIC_MOTION || wristTravel(sequence) > WRIST_TRAVEL_MOTION;
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

// Saved gestures don't change once recorded, so convert each one once
// instead of on every camera frame.
const sequenceCache = new WeakMap<StoredCustomGesture, { sequence: Sequence | null; motion: number }>();

function cachedSample(gesture: StoredCustomGesture) {
  let entry = sequenceCache.get(gesture);
  if (!entry) {
    const sequence = storedSequence(gesture);
    entry = { sequence, motion: sequence && isMotionSequence(sequence) ? 1 : 0 };
    sequenceCache.set(gesture, entry);
  }
  return entry;
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
  return relativeTrajectory(resampleSequence(filtered, SAMPLE_FRAMES));
}

/** Classify a recorded/rolling window of frames (each frame: 1 or 2 hands). */
export function classifyCustomGesture(
  frameHands: Landmark[][][],
  gestures: StoredCustomGesture[],
  minConfidence = 0.2,
): CustomGestureMatch | null {
  if (!frameHands || frameHands.length === 0 || gestures.length === 0) return null;
  const normal = normalizeRecordedFrames(frameHands, false);
  const mirrored = normalizeRecordedFrames(frameHands, true);
  if (!normal && !mirrored) return null;
  const candidates = [normal, mirrored].filter((s): s is Sequence => s !== null);
  const inputHands: 1 | 2 = candidates[0][0].length === 126 ? 2 : 1;
  const staticCandidates = candidates.map((candidate) =>
    relativeTrajectory(resampleSequence(candidate, SAMPLE_FRAMES)),
  );
  const inputHasMotion = candidates.some(isMotionSequence);

  let best: (CustomGestureMatch & { avg: number; max: number }) | null = null;
  for (const gesture of gestures) {
    const { sequence: sample, motion: sampleMotion } = cachedSample(gesture);
    if (!sample) continue;
    const gestureHands: 1 | 2 = gesture.hands === 2 || sample[0].length === 126 ? 2 : 1;
    if (gestureHands !== inputHands) continue;

    let chosen: { avg: number; max: number } | null = null;
    const matchingCandidates =
      sampleMotion > STATIC_MOTION ? candidates : staticCandidates;
    for (const candidate of matchingCandidates) {
      if (candidate[0].length !== sample[0].length) continue;
      // Static captures require a near-static live pose to avoid matching random mid-motion hands.
      if (!sampleMotion && motionAmount(candidate) > INPUT_STATIC_MOTION) continue;

      if (sampleMotion) {
        // Search short subsequences at several durations so users can perform
        // the same motion at a different speed or after a brief pause.
        const minLength = Math.min(8, candidate.length);
        const maxLength = Math.min(40, candidate.length);
        for (let start = 0; start + minLength <= candidate.length; start += 2) {
          for (let length = minLength; length <= maxLength; length += 4) {
            if (start + length > candidate.length) continue;
            const segment = candidate.slice(start, start + length);
            const aligned = relativeTrajectory(resampleSequence(segment, SAMPLE_FRAMES));
            const d = sequenceDistance(aligned, sample);
            if (!chosen || d.avg < chosen.avg) chosen = d;
          }
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

  const clearDistance = inputHands === 2 ? TWO_CLEAR_DISTANCE : ONE_CLEAR_DISTANCE;
  if (!best) return null;
  const bestStored = gestures.find((g) => g.id === best!.id) ?? null;
  const bestIsMotion = Boolean(bestStored && cachedSample(bestStored).motion);
  const confidenceScale = bestIsMotion ? MOTION_MATCH_BONUS : 1;
  const limit = clearDistance * confidenceScale * (1 - minConfidence);
  if (best.avg > limit) return null;
  if (best.max > limit * MAX_FRAME_DISTANCE_MULT) return null;

  // Motion gestures should not fire on a static pose.
  if (bestIsMotion && !inputHasMotion) return null;

  const confidence = Math.max(0, Math.min(0.99, 1 - best.avg / (clearDistance * confidenceScale)));
  if (confidence < minConfidence) return null;
  return { id: best.id, label: best.label, hands: best.hands, confidence };
}
