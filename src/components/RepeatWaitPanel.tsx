"use client";

import { Repeat2 } from "lucide-react";
import { PixelPanel } from "@/components/PixelPanel";
import { cn } from "@/lib/utils";

/**
 * Discrete stops. The first four are the fine-control range (1–2.5 s), and the
 * rest keep the longer waits available without making the slider imprecise.
 */
const STOPS = [1000, 1500, 2000, 2500, 3000, 4000, 5000, 8000, 10000, 15000] as const;

function format(ms: number) {
  return ms % 1000 === 0 ? `${ms / 1000}s` : `${(ms / 1000).toFixed(1)}s`;
}

function nearestIndex(value: number) {
  let best = 0;
  for (let index = 1; index < STOPS.length; index += 1) {
    if (Math.abs(STOPS[index] - value) < Math.abs(STOPS[best] - value)) best = index;
  }
  return best;
}

export function RepeatWaitPanel({
  value,
  onChange,
}: {
  value: number;
  onChange: (repeatMs: number) => void;
}) {
  const index = nearestIndex(value);

  return (
    <PixelPanel className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <span className="label flex items-center gap-2">
            <Repeat2 className="h-3.5 w-3.5 text-accent" />
            repeat wait
          </span>
          <p className="mt-1.5 text-xs leading-relaxed text-white/50">
            Keep the same signal held and AirSign will not speak it again until this wait
            passes. Change the gesture or lower your hand to speak a new phrase right away.
          </p>
        </div>
        <span className="label shrink-0 !text-accent">{format(value)}</span>
      </div>

      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={STOPS.length - 1}
          step={1}
          value={index}
          aria-label="Repeat wait"
          aria-valuetext={format(value)}
          onChange={(event) => onChange(STOPS[Number(event.target.value)])}
          className="h-6 w-full cursor-pointer accent-[#ff7a00]"
        />
        <div className="mt-1 flex justify-between">
          {STOPS.map((ms) => (
            <span
              key={ms}
              className={cn(
                "text-[8px] tabular-nums transition",
                value === ms ? "font-medium text-accent" : "text-white/35",
              )}
            >
              {format(ms)}
            </span>
          ))}
        </div>
      </div>
    </PixelPanel>
  );
}
