import { access, cp, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const wasmSource = resolve(root, "node_modules/@mediapipe/tasks-vision/wasm");
const wasmTarget = resolve(root, "public/mediapipe/wasm");
const modelDirectory = resolve(root, "public/models");
const models = [
  {
    name: "hand_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  },
  {
    name: "gesture_recognizer.task",
    url: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
  },
];

await access(wasmSource).catch(() => {
  throw new Error("MediaPipe is not installed. Run npm install, then npm run setup:assets.");
});
await mkdir(resolve(root, "public/mediapipe"), { recursive: true });
await cp(wasmSource, wasmTarget, { recursive: true, force: true });
await mkdir(modelDirectory, { recursive: true });

for (const model of models) {
  const destination = resolve(modelDirectory, model.name);
  const exists = await access(destination).then(() => true).catch(() => false);
  if (exists) {
    console.log(`Using existing ${model.name}`);
    continue;
  }

  console.log(`Downloading ${model.name} from the MediaPipe model repository…`);
  let response;
  try {
    response = await fetch(model.url, { signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new Error(`Could not reach the MediaPipe model repository. Check your connection and retry npm run setup:assets.`);
  }
  if (!response.ok) {
    throw new Error(`Could not download ${model.name} (${response.status}). Check your connection and retry.`);
  }
  const data = new Uint8Array(await response.arrayBuffer());
  if (data.byteLength < 1_000_000) {
    throw new Error(`The downloaded ${model.name} file looks incomplete. Remove it and retry.`);
  }
  await writeFile(destination, data);
  console.log(`Saved ${model.name} (${(data.byteLength / 1_000_000).toFixed(1)} MB)`);
}

console.log("MediaPipe assets are ready in public/.");
