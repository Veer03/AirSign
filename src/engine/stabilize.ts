import { MIN_CONFIDENCE, type GestureId } from "@/lib/contracts";

export type RawFrame = { gesture: string; confidence: number } | null;

export type StableCandidate = { gesture: GestureId; confidence: number };

export type StabilizeResult = {
  candidate: StableCandidate | null;
  /** 0..1 dwell progress for the ring. */
  progress: number;
  /** Set for exactly one frame when the gesture locks. */
  locked: GestureId | null;
  /** Remaining repeat-wait time while the same held gesture is cooling down. */
  repeatWaitMs: number;
};

const GESTURES = new Set<string>([
  "Thumb_Up",
  "Thumb_Down",
  "Victory",
  "Open_Palm",
  "Closed_Fist",
  "Pointing_Up",
  "ILoveYou",
  "Middle_Finger",
  "Finger_Heart",
  "Wow",
  "Custom_Gesture",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => `ASL_${letter}`),
]);

/**
 * A single dropped frame should not re-arm the repeat wait, but a real release
 * (hand lowered or signal lost) should. 400 ms filters classifier flicker.
 */
const RELEASE_GRACE_MS = 400;

export function isGestureId(value: string): value is GestureId {
  return GESTURES.has(value);
}

/**
 * Shared lock logic: requires N stable frames, then a dwell window, then
 * fires once. A short cooldown stops double-fires, while a longer repeat wait
 * stops the same held signal from speaking over and over. A different signal,
 * or dropping the hand, re-arms it immediately.
 */
class CoreStabilizer<T extends string> {
  private history: T[] = [];
  private active: T | null = null;
  private startedAt = 0;
  private lastLockAt = Number.NEGATIVE_INFINITY;
  private lastLockedValue: T | null = null;
  private missingSince: number | null = null;
  private repeatMs = 0;

  constructor(
    private dwellMs = 250,
    private readonly stableFrames = 2,
    private readonly cooldownMs = 800,
    repeatMs = 0,
  ) {
    this.repeatMs = Math.max(0, repeatMs);
  }

  setDwell(dwellMs: number) {
    this.dwellMs = Math.max(0, dwellMs);
  }

  setRepeat(repeatMs: number) {
    this.repeatMs = Math.max(0, repeatMs);
  }

  reset() {
    this.history = [];
    this.active = null;
    this.startedAt = 0;
    this.lastLockedValue = null;
    this.missingSince = null;
  }

  push(
    value: T | null,
    now: number,
    dwellMs = this.dwellMs,
  ): { progress: number; locked: T | null; repeatWaitMs: number } {
    if (value === null) {
      this.history = [];
      this.active = null;
      this.startedAt = 0;

      // A brief dropout is just noise. Only a sustained release re-arms the
      // same signal so it can speak again immediately.
      if (this.missingSince === null) this.missingSince = now;
      if (now - this.missingSince >= RELEASE_GRACE_MS) {
        this.lastLockedValue = null;
      }

      return { progress: 0, locked: null, repeatWaitMs: 0 };
    }

    this.missingSince = null;

    this.history.push(value);
    if (this.history.length > this.stableFrames) this.history.shift();

    const stable =
      this.history.length >= this.stableFrames &&
      this.history.every((entry) => entry === value);

    if (!stable) {
      this.active = null;
      this.startedAt = 0;
      return { progress: 0, locked: null, repeatWaitMs: 0 };
    }

    if (this.active !== value) {
      this.active = value;
      this.startedAt = now;
    }

    const elapsed = now - this.startedAt;
    const dwell = Math.max(0, dwellMs);
    const dwellProgress = dwell <= 0 ? 1 : Math.min(1, elapsed / dwell);

    const sinceLock = now - this.lastLockAt;
    const cooled = sinceLock >= this.cooldownMs;
    const repeatBlocked = this.lastLockedValue === value && sinceLock < this.repeatMs;

    if (repeatBlocked) {
      // Let the ring fill across the repeat wait so the hold still feels alive.
      return {
        progress: this.repeatMs > 0 ? Math.min(1, sinceLock / this.repeatMs) : 0,
        locked: null,
        repeatWaitMs: Math.max(0, this.repeatMs - sinceLock),
      };
    }

    if (dwellProgress >= 1 && cooled) {
      this.lastLockAt = now;
      this.lastLockedValue = value;
      this.active = null;
      this.startedAt = 0;
      this.history = [];
      return { progress: 1, locked: value, repeatWaitMs: 0 };
    }

    return {
      progress: cooled ? dwellProgress : 0,
      locked: null,
      repeatWaitMs: 0,
    };
  }
}

/**
 * Turns noisy per-frame recogniser output into one lock.
 *
 * - requires `stableFrames` consecutive matching frames (default 2, ~66 ms at 30 fps)
 * - then accumulates dwell time
 * - fires once, then respects a cooldown even while the hand stays still
 */
export class GestureStabilizer {
  private core: CoreStabilizer<GestureId>;

  constructor(dwellMs = 250, stableFrames = 2, cooldownMs = 800, repeatMs = 0) {
    this.core = new CoreStabilizer(dwellMs, stableFrames, cooldownMs, repeatMs);
  }

  setDwell(dwellMs: number) {
    this.core.setDwell(dwellMs);
  }

  setRepeat(repeatMs: number) {
    this.core.setRepeat(repeatMs);
  }

  reset() {
    this.core.reset();
  }

  push(frame: RawFrame, now: number): StabilizeResult {
    if (!frame || frame.confidence < MIN_CONFIDENCE || !isGestureId(frame.gesture)) {
      const result = this.core.push(null, now);
      return {
        candidate: null,
        progress: result.progress,
        locked: null,
        repeatWaitMs: result.repeatWaitMs,
      };
    }

    const result = this.core.push(frame.gesture, now);

    return {
      candidate: { gesture: frame.gesture, confidence: frame.confidence },
      progress: result.progress,
      locked: result.locked,
      repeatWaitMs: result.repeatWaitMs,
    };
  }
}

export type SignFrame = { sign: string; confidence: number } | null;

export type SignStabilizeResult = {
  candidate: SignFrame;
  progress: number;
  locked: string | null;
  /** Remaining repeat-wait time while the same held sign is cooling down. */
  repeatWaitMs: number;
};

/**
 * Same lock rules, but keyed on an arbitrary sign id so one stream can carry
 * both single-hand gestures and two-hand combos without double-speaking.
 */
export class SignStabilizer {
  private core: CoreStabilizer<string>;

  constructor(dwellMs = 250, stableFrames = 2, cooldownMs = 800, repeatMs = 0) {
    this.core = new CoreStabilizer(dwellMs, stableFrames, cooldownMs, repeatMs);
  }

  setDwell(dwellMs: number) {
    this.core.setDwell(dwellMs);
  }

  setRepeat(repeatMs: number) {
    this.core.setRepeat(repeatMs);
  }

  reset() {
    this.core.reset();
  }

  push(frame: SignFrame, now: number, dwellMs?: number): SignStabilizeResult {
    if (!frame || frame.confidence < MIN_CONFIDENCE) {
      const result = this.core.push(null, now);
      return {
        candidate: null,
        progress: result.progress,
        locked: null,
        repeatWaitMs: result.repeatWaitMs,
      };
    }

    const result = this.core.push(frame.sign, now, dwellMs);

    return {
      candidate: frame,
      progress: result.progress,
      locked: result.locked,
      repeatWaitMs: result.repeatWaitMs,
    };
  }
}
