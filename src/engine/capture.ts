import type { ContextId, SignCapture } from "@/lib/contracts";
import { VALUES_PER_FRAME } from "./normalize";

export type CapturedFrame = { at: number; values: number[]; hands: number };

/** Keep a short rolling window of normalized frames while capture is active. */
export class CaptureBuffer {
  private frames: CapturedFrame[] = [];

  constructor(private readonly maxFrames = 180) {}

  push(frame: CapturedFrame) {
    this.frames.push(frame);
    if (this.frames.length > this.maxFrames) this.frames.shift();
  }

  clear() {
    this.frames = [];
  }

  get length() {
    return this.frames.length;
  }

  get handFrames() {
    return this.frames.filter((frame) => frame.hands > 0).length;
  }

  toSignCapture(context: ContextId, durationMs: number): SignCapture {
    const detected = this.frames.filter((frame) => frame.hands > 0);
    // Two evenly spaced 126-value snapshots stay within the 256-number API cap.
    const first = detected[0]?.values;
    const last = detected.at(-1)?.values;
    const summary = first && last
      ? [...first.slice(0, VALUES_PER_FRAME), ...last.slice(0, VALUES_PER_FRAME)]
      : [];

    return {
      context,
      frames: detected.length,
      durationMs: Math.round(durationMs),
      // The canned gesture model labels general handshapes, not ASL words.
      // Keep candidates empty until the vocabulary classifier is integrated.
      candidates: [],
      summary: summary.length ? summary : undefined,
    };
  }
}
