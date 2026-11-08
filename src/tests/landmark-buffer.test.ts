import { describe, expect, it } from "vitest";
import { LandmarkBuffer, type LandmarkFrame } from "../engine/landmark-buffer";

function frame(t: number): LandmarkFrame {
  return { t, hands: [] };
}

describe("LandmarkBuffer", () => {
  it("keeps only the requested trailing window", () => {
    const buffer = new LandmarkBuffer(1000, 90);
    for (let t = 0; t <= 2000; t += 100) buffer.push(frame(t));

    const window = buffer.snapshot(500);
    expect(window[0].t).toBe(1500);
    expect(window[window.length - 1].t).toBe(2000);
  });

  it("caps the frame count", () => {
    const buffer = new LandmarkBuffer(10_000, 5);
    for (let t = 0; t < 20; t += 1) buffer.push(frame(t));

    const all = buffer.snapshot(10_000);
    expect(all).toHaveLength(5);
    expect(all[0].t).toBe(15);
  });

  it("returns an empty snapshot when cleared or empty", () => {
    const buffer = new LandmarkBuffer();
    expect(buffer.snapshot()).toEqual([]);
    buffer.push(frame(100));
    expect(buffer.snapshot()).toHaveLength(1);
    buffer.clear();
    expect(buffer.snapshot()).toEqual([]);
  });
});
