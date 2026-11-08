import type { HandSide } from "@/lib/contracts";
import type { Landmark } from "./landmarks";

export type LandmarkHand = {
  id: string;
  side: HandSide;
  gesture: string;
  confidence: number;
  landmarks: Landmark[] | null;
};

export type LandmarkFrame = {
  t: number;
  hands: LandmarkHand[];
};

/**
 * Rolling window of landmark frames. This is the exact input a future
 * on-device sign classifier will consume, so the recognizer boundary is
 * already wired to it.
 */
export class LandmarkBuffer {
  private frames: LandmarkFrame[] = [];

  constructor(
    private readonly maxMs = 1000,
    private readonly maxFrames = 90,
  ) {}

  push(frame: LandmarkFrame) {
    this.frames.push(frame);

    const cutoff = frame.t - this.maxMs;
    while (
      this.frames.length > 0 &&
      (this.frames[0].t < cutoff || this.frames.length > this.maxFrames)
    ) {
      this.frames.shift();
    }
  }

  snapshot(maxMs = this.maxMs): LandmarkFrame[] {
    const last = this.frames[this.frames.length - 1];
    if (!last) return [];
    const cutoff = last.t - maxMs;
    return this.frames.filter((frame) => frame.t >= cutoff);
  }

  clear() {
    this.frames = [];
  }
}
