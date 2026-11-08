"use client";

import type * as Ort from "onnxruntime-web";

// ONNX Runtime is served locally so model inference works offline. Use the
// WebGPU build on browsers that expose WebGPU, with the normal WASM build as
// a compatibility fallback (including if WebGPU session creation fails).
const WASM_ORT_URL = "/ort/ort.wasm.min.mjs";
const WEBGPU_ORT_URL = "/ort/ort.webgpu.bundle.min.mjs";

const importAtRuntime = new Function("url", "return import(url)") as (
  url: string,
) => Promise<typeof Ort>;

let wasmOrtPromise: Promise<typeof Ort> | null = null;
let ortPromise: Promise<typeof Ort> | null = null;
let usingWebGpuRuntime = false;

function hasWebGpu(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

function configure(ort: typeof Ort): typeof Ort {
  ort.env.wasm.wasmPaths = "/ort/";
  ort.env.wasm.numThreads = 1;
  // ORT prints routine warnings (e.g. "some nodes were not assigned to the
  // preferred execution providers" for shape ops it moves to CPU) through
  // console.error. They are harmless, so only surface real errors.
  ort.env.logLevel = "error";
  return ort;
}

/** Load the stable WASM runtime for models that need predictable inference. */
export function loadWasmOrt(): Promise<typeof Ort> {
  if (!wasmOrtPromise) {
    wasmOrtPromise = importAtRuntime(WASM_ORT_URL).then(configure).catch((error) => {
      wasmOrtPromise = null;
      throw error;
    });
  }
  return wasmOrtPromise;
}

/** Shared runtime; recent Apple/Samsung browsers can use WebGPU for ONNX models. */
export function loadOrt(): Promise<typeof Ort> {
  if (!ortPromise) {
    ortPromise = (hasWebGpu()
      ? importAtRuntime(WEBGPU_ORT_URL).then((ort) => {
          usingWebGpuRuntime = true;
          return configure(ort);
        })
      : loadWasmOrt()
    ).catch(() => {
      usingWebGpuRuntime = false;
      return loadWasmOrt();
    });
  }
  return ortPromise;
}

/** Create a GPU accelerated session when available, retrying on WASM on failure. */
export async function createInferenceSession(
  modelUrl: string,
  options: Omit<Ort.InferenceSession.SessionOptions, "executionProviders"> = {},
): Promise<Ort.InferenceSession> {
  const ort = await loadOrt();
  if (hasWebGpu() && usingWebGpuRuntime) {
    try {
      return await ort.InferenceSession.create(modelUrl, {
        logSeverityLevel: 3,
        ...options,
        executionProviders: ["webgpu", "wasm"],
      });
    } catch {
      // Older drivers and partial WebGPU implementations can expose `gpu`
      // but fail to create a session; retain reliable WASM inference.
    }
  }
  const wasm = await loadWasmOrt();
  return wasm.InferenceSession.create(modelUrl, { logSeverityLevel: 3, ...options, executionProviders: ["wasm"] });
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
