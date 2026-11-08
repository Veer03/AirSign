// Copies the MediaPipe wasm runtime into public/ and downloads the gesture
// recognizer model, so the demo never depends on CDNs or venue Wi-Fi.
import { cp, mkdir, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wasmSrc = path.join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const wasmDest = path.join(root, "public", "mediapipe", "wasm");
const modelDir = path.join(root, "public", "models");
const modelDest = path.join(modelDir, "gesture_recognizer.task");
const modelUrl =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

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

  await mkdir(modelDir, { recursive: true });

  if (await exists(modelDest)) {
    console.log("model already present, skipping download");
    return;
  }

  console.log("downloading gesture recognizer model...");
  const response = await fetch(modelUrl);
  if (!response.ok || !response.body) {
    throw new Error(`model download failed: ${response.status} ${response.statusText}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(modelDest));
  const { size } = await stat(modelDest);
  console.log(`saved model (${(size / 1024 / 1024).toFixed(1)} MB) -> ${path.relative(root, modelDest)}`);
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  // Leave a hint file so the app can show a clear error instead of a blank camera.
  try {
    await writeFile(
      path.join(root, "public", "models", "README.txt"),
      "Run `npm run setup:assets` to download gesture_recognizer.task\n",
      { flag: "w" },
    );
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
