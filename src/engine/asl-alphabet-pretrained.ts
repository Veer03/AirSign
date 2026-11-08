"use client";

// Pretrained alternative to Harshpal's kNN alphabet (asl-alphabet.ts), with the
// same classify() shape so useGestures can swap between them.
//
// Model: nocontextdoruk/asl-landmark-mlp (Hugging Face), CC BY-NC 4.0.
// Input "input" [1, 63]: 21 hand landmarks, wrist-relative, divided by
// |landmark 9|, exactly as the model card documents. No mirroring and no
// aspect correction: measured on Harshpal's 1,956 labelled samples (J/Z
// excluded) that is 64.7% top-1 vs 57.4% with 16:9 correction and 10.5%
// mirrored, and 81% on frames with confidence >= 0.9 (70% of frames).

import type { ASLLetter } from "./asl-alphabet";
import type { Landmark } from "./landmarks";
import { createInferenceSession, loadOrt, softmax } from "./ort";

const MODEL_URL = "/models/asl_alphabet.onnx";
const LABELS_URL = "/models/asl_alphabet_labels.json";
/** Below this the frame is ignored (see accuracy numbers above). */
export const PRETRAINED_MIN_CONFIDENCE = 0.9;
/** A result older than this is stale (hand moved on / left the frame). */
const MAX_RESULT_AGE_MS = 200;

type Result = { letter: ASLLetter; confidence: number; side: "left" | "right" | "unknown" };

export function normalizeForPretrained(points: Landmark[]): Float32Array | null {
  if (points.length < 21) return null;
  const wrist = points[0];
  const rel = points.slice(0, 21).map((p) => [p.x - wrist.x, p.y - wrist.y, (p.z ?? 0) - (wrist.z ?? 0)]);
  const scale = Math.hypot(rel[9][0], rel[9][1], rel[9][2]) || 1;
  return Float32Array.from(rel.flat(), (value) => value / scale);
}

export class PretrainedAlphabetClassifier {
  private busy = false;
  private latest: (Result & { at: number }) | null = null;

  constructor(
    private readonly run: (input: Float32Array) => Promise<Float32Array>,
    private readonly labels: string[],
  ) {}

  /**
   * Same signature as the kNN. Inference is async (~1–5 ms), so this starts a
   * run for the current hand and returns the most recent finished result:
   * one frame of lag, never blocks the camera loop.
   */
  classify(points: Landmark[] | null | undefined, side: "left" | "right" | "unknown"): Result | null {
    if (!points) {
      this.latest = null;
      return null;
    }
    if (!this.busy) {
      const input = normalizeForPretrained(points);
      if (input) {
        this.busy = true;
        void this.run(input)
          .then((logits) => {
            const probs = softmax(logits);
            // Letters only: digits look like letters (0≈O, 2≈V, 6≈W).
            let best = -1;
            let total = 0;
            this.labels.forEach((label, index) => {
              if (!/^[A-Z]$/.test(label)) return;
              total += probs[index];
              if (best < 0 || probs[index] > probs[best]) best = index;
            });
            const confidence = best >= 0 && total > 0 ? probs[best] / total : 0;
            this.latest =
              best >= 0 && confidence >= PRETRAINED_MIN_CONFIDENCE
                ? { letter: this.labels[best] as ASLLetter, confidence, side, at: performance.now() }
                : null;
          })
          .catch((error) => {
            console.error("[alphabet-pretrained] inference failed", error);
            this.latest = null;
          })
          .finally(() => {
            this.busy = false;
          });
      }
    }
    const latest = this.latest;
    if (!latest || performance.now() - latest.at > MAX_RESULT_AGE_MS) return null;
    return { letter: latest.letter, confidence: latest.confidence, side };
  }
}

let classifierPromise: Promise<PretrainedAlphabetClassifier> | null = null;

export function getPretrainedAlphabetClassifier(): Promise<PretrainedAlphabetClassifier> {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const ort = await loadOrt();
      const [session, labels] = await Promise.all([
        createInferenceSession(MODEL_URL, { graphOptimizationLevel: "all" }),
        fetch(LABELS_URL).then((response) => {
          if (!response.ok) throw new Error(`alphabet labels ${response.status}`);
          return response.json() as Promise<string[]>;
        }),
      ]);
      const inputName = session.inputNames[0];
      const outputName = session.outputNames[0];
      console.info("[alphabet-pretrained] model ready", { inputName, outputName, classes: labels.length });
      return new PretrainedAlphabetClassifier(async (input) => {
        const output = await session.run({ [inputName]: new ort.Tensor("float32", input, [1, 63]) });
        return output[outputName].data as Float32Array;
      }, labels);
    })().catch((error) => {
      classifierPromise = null;
      throw error;
    });
  }
  return classifierPromise;
}
