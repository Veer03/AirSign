"use client";

// [alphabet] Static ASL fingerspelling classifier. Self-contained: delete this
// file, useAlphabet.ts, AlphabetOverlay.tsx and the [alphabet] lines elsewhere
// to remove the feature.
//
// Model: nocontextdoruk/asl-landmark-mlp (Hugging Face), CC BY-NC 4.0.
// Input "input" float32 [1, 63] = 21 hand landmarks (x, y, z), wrist-relative,
// divided by |landmark 9| (wrist → middle-finger MCP). Output "logits" [1, 36],
// classes 0–9 then A–Z. Static hand shapes only (J and Z are motion letters
// in real ASL, so expect those to be weak).

import type { Landmark } from "./landmarks";
import { loadOrt, softmax } from "./ort";

const MODEL_URL = "/models/asl_alphabet.onnx";
const LABELS_URL = "/models/asl_alphabet_labels.json";

export type LetterGuess = { letter: string; probability: number };

export type AlphabetOptions = {
  /** Mirror x (use for the left hand, or ?alphaFlip=1 to test). */
  mirror?: boolean;
  /** Video width / height, to undo the non-square normalized coordinates. */
  aspect?: number;
  /** Ignore the digit classes 0–9 (they look like letters: 0≈O, 2≈V, 6≈W). */
  lettersOnly?: boolean;
};

/** The model card's preprocessing, plus optional mirror/aspect correction. */
export function normalizeHand(landmarks: Landmark[], options: AlphabetOptions = {}): Float32Array | null {
  if (landmarks.length < 21) return null;
  const aspect = options.aspect ?? 1;
  const sx = (options.mirror ? -1 : 1) * aspect;
  const wrist = landmarks[0];
  const rel = landmarks.slice(0, 21).map((p) => [(p.x - wrist.x) * sx, p.y - wrist.y, (p.z ?? 0) - (wrist.z ?? 0)]);
  const scale = Math.hypot(rel[9][0], rel[9][1], rel[9][2]) || 1;
  const out = new Float32Array(63);
  rel.forEach((point, i) => {
    out[i * 3] = point[0] / scale;
    out[i * 3 + 1] = point[1] / scale;
    out[i * 3 + 2] = point[2] / scale;
  });
  return out;
}

type AlphabetClassifier = {
  classify(landmarks: Landmark[], options?: AlphabetOptions): Promise<LetterGuess[]>;
};

let classifierPromise: Promise<AlphabetClassifier> | null = null;

async function createClassifier(): Promise<AlphabetClassifier> {
  const ort = await loadOrt();
  const [session, labels] = await Promise.all([
    ort.InferenceSession.create(MODEL_URL, { executionProviders: ["wasm"], graphOptimizationLevel: "all" }),
    fetch(LABELS_URL).then((response) => {
      if (!response.ok) throw new Error(`alphabet labels ${response.status}`);
      return response.json() as Promise<string[]>;
    }),
  ]);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  console.info("[alphabet] model ready", { inputName, outputName, classes: labels.length });

  return {
    async classify(landmarks, options = {}) {
      const input = normalizeHand(landmarks, options);
      if (!input) return [];
      const output = await session.run({ [inputName]: new ort.Tensor("float32", input, [1, 63]) });
      const probs = softmax(output[outputName].data as Float32Array);
      if (options.lettersOnly) {
        labels.forEach((label, index) => {
          if (/^\d$/.test(label)) probs[index] = 0;
        });
        const sum = probs.reduce((a, b) => a + b, 0) || 1;
        for (let i = 0; i < probs.length; i += 1) probs[i] /= sum;
      }
      return Array.from(probs.keys())
        .sort((a, b) => probs[b] - probs[a])
        .slice(0, 3)
        .map((index) => ({ letter: labels[index] ?? "?", probability: probs[index] }));
    },
  };
}

/**
 * Locks a letter once it has been the confident top-1 for `holdMs`. The same
 * letter locks again only after the hand is released / the letter changes, or
 * after holding a further `repeatMs` (for double letters like "LL").
 */
export class LetterLock {
  private active: string | null = null;
  private startedAt = 0;
  private lastLocked: string | null = null;
  private lastLockAt = Number.NEGATIVE_INFINITY;
  private released = true;

  constructor(
    public holdMs = 600,
    public repeatMs = 1500,
    public minProbability = 0.7,
  ) {}

  reset() {
    this.active = null;
    this.released = true;
  }

  push(letter: string | null, probability: number, now: number): { progress: number; locked: string | null } {
    if (!letter || probability < this.minProbability) {
      this.active = null;
      this.released = true;
      return { progress: 0, locked: null };
    }
    if (letter !== this.active) {
      this.active = letter;
      this.startedAt = now;
    }
    const progress = Math.min(1, (now - this.startedAt) / this.holdMs);
    if (progress < 1) return { progress, locked: null };

    const canLock =
      letter !== this.lastLocked || this.released || now - this.lastLockAt >= this.repeatMs;
    if (!canLock) return { progress: 1, locked: null };

    this.lastLocked = letter;
    this.lastLockAt = now;
    this.released = false;
    this.startedAt = now; // a repeat needs a fresh hold
    return { progress: 1, locked: letter };
  }
}

export function getAlphabetClassifier(): Promise<AlphabetClassifier> {
  if (!classifierPromise) {
    classifierPromise = createClassifier().catch((error) => {
      classifierPromise = null;
      throw error;
    });
  }
  return classifierPromise;
}
