"use client";

import type * as Ort from "onnxruntime-web";

// onnxruntime-web is served from public/ort (copied by `npm run setup:assets`)
// and imported at runtime so the bundler never processes its wasm glue.
const ORT_URL = "/ort/ort.wasm.min.mjs";

const importAtRuntime = new Function("url", "return import(url)") as (
  url: string,
) => Promise<typeof Ort>;

let ortPromise: Promise<typeof Ort> | null = null;

/** Shared onnxruntime-web instance (wasm, one thread; threads need cross-origin isolation). */
export function loadOrt(): Promise<typeof Ort> {
  if (!ortPromise) {
    ortPromise = importAtRuntime(ORT_URL)
      .then((ort) => {
        ort.env.wasm.wasmPaths = "/ort/";
        ort.env.wasm.numThreads = 1;
        return ort;
      })
      .catch((error) => {
        ortPromise = null;
        throw error;
      });
  }
  return ortPromise;
}

export function softmax(logits: ArrayLike<number>): Float32Array {
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < logits.length; i += 1) if (logits[i] > max) max = logits[i];
  const out = new Float32Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i += 1) {
    out[i] = Math.exp(logits[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < out.length; i += 1) out[i] /= sum;
  return out;
}
