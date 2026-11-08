"use client";

import { FRAME_POINTS, stackFrames } from "./holistic-frame";
import { loadOrt, softmax } from "./ort";

/**
 * Kaggle asl-signs (250 isolated signs) classifier, ONNX build of the
 * competition model. Input: [T, 543, 3] float32 raw Holistic landmarks with
 * NaN for missing parts; the model does its own preprocessing. Output: [250]
 * logits. About 15–40 ms per sign on one wasm thread, so it runs once per
 * sign on the main thread.
 */

export type WordGuess = { gloss: string; probability: number };

type Classifier = {
  classify(frames: Float32Array[]): Promise<WordGuess[]>;
};

const MODEL_URL = "/models/asl_signs.onnx";
const LABELS_URL = "/models/asl_signs_labels.json";

let classifierPromise: Promise<Classifier> | null = null;

async function createClassifier(): Promise<Classifier> {
  const ort = await loadOrt();

  const [session, signToIndex] = await Promise.all([
    ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    }),
    fetch(LABELS_URL).then((response) => {
      if (!response.ok) throw new Error(`labels ${response.status}`);
      return response.json() as Promise<Record<string, number>>;
    }),
  ]);

  const labels: string[] = [];
  for (const [gloss, index] of Object.entries(signToIndex)) labels[index] = gloss;

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  console.info("[asl] model ready", { inputName, outputName, classes: labels.length });

  return {
    async classify(frames) {
      const tensor = new ort.Tensor("float32", stackFrames(frames), [frames.length, FRAME_POINTS, 3]);
      const started = performance.now();
      const output = await session.run({ [inputName]: tensor });
      const probs = softmax(output[outputName].data as Float32Array);
      const top = Array.from(probs.keys())
        .sort((a, b) => probs[b] - probs[a])
        .slice(0, 3)
        .map((index) => ({ gloss: labels[index] ?? `#${index}`, probability: probs[index] }));
      if (typeof window !== "undefined" && window.location.search.includes("debugAsl=1")) {
        console.info(
          `[asl] T=${frames.length} ${(performance.now() - started).toFixed(0)}ms`,
          top.map((guess) => `${guess.gloss} ${(guess.probability * 100).toFixed(0)}%`).join(" | "),
        );
      }
      return top;
    },
  };
}

export function getAslClassifier(): Promise<Classifier> {
  if (!classifierPromise) {
    classifierPromise = createClassifier().catch((error) => {
      classifierPromise = null;
      throw error;
    });
  }
  return classifierPromise;
}

/** Nicer spoken text for a few glosses; everything else is spoken as-is. */
const SPOKEN: Record<string, string> = {
  thankyou: "Thank you",
  hello: "Hello",
  please: "Please",
  yes: "Yes",
  no: "No",
  sick: "I feel sick",
  owie: "It hurts",
  drink: "I'd like a drink",
  water: "Water, please",
  thirsty: "I'm thirsty",
  hungry: "I'm hungry",
  wait: "Please wait",
  bye: "Goodbye",
  callonphone: "Call on the phone",
  minemy: "Mine",
  hesheit: "Them",
  weus: "Us",
  haveto: "I have to",
  frenchfries: "French fries",
  glasswindow: "Window",
  TV: "TV",
};

export function glossToText(gloss: string): string {
  if (SPOKEN[gloss]) return SPOKEN[gloss];
  return gloss.charAt(0).toUpperCase() + gloss.slice(1);
}
