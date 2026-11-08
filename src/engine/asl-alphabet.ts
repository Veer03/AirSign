import type { Landmark } from "./landmarks";

export type ASLLetter =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
  | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";

type Sample = { letter: ASLLetter; values: Float32Array };
const FEATURE_COUNT = 21 * 3;
const K = 5;

export function normalizeHandLandmarks(points: Landmark[], mirror = false): Float32Array | null {
  if (points.length < 21) return null;
  const wrist = points[0];
  const middleBase = points[9];
  const scale = Math.hypot(middleBase.x - wrist.x, middleBase.y - wrist.y);
  if (scale < 1e-5) return null;

  const values = new Float32Array(FEATURE_COUNT);
  for (let i = 0; i < 21; i += 1) {
    const point = points[i];
    const offset = i * 3;
    values[offset] = (point.x - wrist.x) / scale * (mirror ? -1 : 1);
    values[offset + 1] = (point.y - wrist.y) / scale;
    values[offset + 2] = (point.z - wrist.z) / scale;
  }
  return values;
}

const normalize = normalizeHandLandmarks;

export class ASLAlphabetClassifier {
  constructor(private readonly samples: Sample[]) {}

  classify(points: Landmark[] | null, side: "left" | "right" | "unknown") {
    if (!points) return null;
    const normal = normalize(points);
    const mirrored = normalize(points, true);
    if (!normal || !mirrored) return null;

    const nearest: Array<{ letter: ASLLetter; distance: number }> = [];
    for (const sample of this.samples) {
      let distance = 0;
      let mirroredDistance = 0;
      for (let i = 0; i < FEATURE_COUNT; i += 1) {
        const delta = normal[i] - sample.values[i];
        const mirrorDelta = mirrored[i] - sample.values[i];
        distance += delta * delta;
        mirroredDistance += mirrorDelta * mirrorDelta;
      }
      // Dataset hand laterality is undocumented, so compare both orientations.
      const bestDistance = Math.min(distance, mirroredDistance);
      let insertAt = nearest.findIndex((item) => item.distance > bestDistance);
      if (insertAt < 0) insertAt = nearest.length;
      if (insertAt < K) {
        nearest.splice(insertAt, 0, { letter: sample.letter, distance: bestDistance });
        if (nearest.length > K) nearest.pop();
      }
    }

    if (nearest.length < K || nearest[0].distance > 7) return null;
    const votes = new Map<ASLLetter, number>();
    for (const neighbor of nearest) {
      votes.set(neighbor.letter, (votes.get(neighbor.letter) ?? 0) + 1);
    }
    const winner = [...votes].sort((a, b) => b[1] - a[1])[0];
    if (!winner || winner[1] < 3) return null;

    return {
      letter: winner[0],
      confidence: Math.min(0.95, 0.5 + winner[1] / K * 0.45),
      side,
    };
  }
}

let classifierPromise: Promise<ASLAlphabetClassifier> | null = null;

export function getASLAlphabetClassifier(): Promise<ASLAlphabetClassifier> {
  if (!classifierPromise) {
    classifierPromise = fetch("/data/asl-landmarks.csv", { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`ASL alphabet data failed to load (${response.status})`);
        const csv = await response.text();
        const lines = csv.trim().split(/\r?\n/);
        if (!lines[0]?.endsWith(",label")) throw new Error("ASL alphabet data has an invalid header");

        const samples: Sample[] = [];
        for (const line of lines.slice(1)) {
          const columns = line.split(",");
          const label = columns[FEATURE_COUNT];
          if (columns.length !== FEATURE_COUNT + 1 || !/^[A-Z]$/.test(label ?? "")) continue;
          const values = columns.slice(0, FEATURE_COUNT).map(Number);
          if (values.some((value) => !Number.isFinite(value))) continue;

          const points: Landmark[] = [];
          for (let i = 0; i < FEATURE_COUNT; i += 3) {
            points.push({ x: values[i], y: values[i + 1], z: values[i + 2] });
          }
          const normalized = normalizeHandLandmarks(points);
          if (normalized) samples.push({ letter: label as ASLLetter, values: normalized });
        }

        const letters = new Set(samples.map((sample) => sample.letter));
        if (letters.size !== 26) throw new Error("ASL alphabet data is missing one or more letters");
        return new ASLAlphabetClassifier(samples);
      })
      .catch((error) => {
        classifierPromise = null;
        throw error;
      });
  }
  return classifierPromise;
}
