// Copies the MediaPipe and ONNX Runtime wasm files into public/
// and downloads every model, so the demo never depends on CDNs or venue Wi-Fi.
import { cp, mkdir, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wasmSrc = path.join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const wasmDest = path.join(root, "public", "mediapipe", "wasm");
const ortSrc = path.join(root, "node_modules", "onnxruntime-web", "dist");
const ortDest = path.join(root, "public", "ort");
// Only the plain-wasm build: loaded at runtime so the bundler never touches it.
const ortFiles = ["ort.wasm.min.mjs", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"];
const modelDir = path.join(root, "public", "models");

const models = [
  {
    file: "gesture_recognizer.task",
    url: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
  },
  {
    file: "holistic_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task",
  },
  // Kaggle asl-signs model as ONNX (from github.com/nlevites/signchat, MIT).
  // Input [T, 543, 3] float32 raw Holistic landmarks with NaN; output [250] logits.
  {
    file: "asl_signs.onnx",
    url: "https://raw.githubusercontent.com/nlevites/signchat/HEAD/apps/web/public/models/asl-signs/asl-signs.onnx",
  },
  {
    file: "asl_signs_labels.json",
    url: "https://huggingface.co/sign/kaggle-asl-signs-1st-place/resolve/main/sign_to_prediction_index_map.json",
  },
  // "alphabet · pretrained" tab: static ASL letters from 21 hand landmarks
  // (CC BY-NC 4.0): https://huggingface.co/nocontextdoruk/asl-landmark-mlp
  {
    file: "asl_alphabet.onnx",
    url: "https://huggingface.co/nocontextdoruk/asl-landmark-mlp/resolve/main/mlp_asl.onnx",
  },
  {
    file: "asl_alphabet_labels.json",
    url: "https://huggingface.co/nocontextdoruk/asl-landmark-mlp/resolve/main/mlp_classes.json",
  },
];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(wasmSrc))) {
    throw new Error(
      "MediaPipe wasm folder not found. Run `npm install` before `npm run setup:assets`.",
    );
  }

  await mkdir(wasmDest, { recursive: true });
  await cp(wasmSrc, wasmDest, { recursive: true });
  console.log(`copied wasm -> ${path.relative(root, wasmDest)}`);

  if (await exists(ortSrc)) {
    await mkdir(ortDest, { recursive: true });
    for (const file of ortFiles) await cp(path.join(ortSrc, file), path.join(ortDest, file));
    console.log(`copied onnxruntime-web -> ${path.relative(root, ortDest)}`);
  }

  await mkdir(modelDir, { recursive: true });

  for (const model of models) {
    const dest = path.join(modelDir, model.file);
    if (await exists(dest)) {
      console.log(`${model.file} already present, skipping download`);
      continue;
    }

    console.log(`downloading ${model.file}...`);
    const response = await fetch(model.url);
    if (!response.ok || !response.body) {
      throw new Error(`${model.file} download failed: ${response.status} ${response.statusText}`);
    }

    await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
    const { size } = await stat(dest);
    console.log(`saved ${model.file} (${(size / 1024 / 1024).toFixed(1)} MB)`);
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  // Leave a hint file so the app can show a clear error instead of a blank camera.
  try {
    await writeFile(
      path.join(root, "public", "models", "README.txt"),
      "Run `npm run setup:assets` to download the models\n",
      { flag: "w" },
    );
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
