"use client";

import { Repeat2 } from "lucide-react";
import { PixelPanel } from "@/components/PixelPanel";
import { cn } from "@/lib/utils";

/**
 * Discrete stops: fine control at the short end (0.25–2.5 s), then a few
 * longer waits up to the 8 s cap.
 */
export const REPEAT_STOPS = [250, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 8000] as const;
export const MAX_REPEAT_MS = REPEAT_STOPS[REPEAT_STOPS.length - 1];
const STOPS = REPEAT_STOPS;

/** 250 → "0.25s", 1500 → "1.5s", 3000 → "3s". */
function format(ms: number) {
  return `${Number((ms / 1000).toFixed(2))}s`;
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
        <span className="label shrink-0 !text-accent">{format(STOPS[index])}</span>
      </div>

      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={STOPS.length - 1}
          step={1}
          value={index}
          aria-label="Repeat wait"
          aria-valuetext={format(STOPS[index])}
          onChange={(event) => onChange(STOPS[Number(event.target.value)])}
          className="h-6 w-full cursor-pointer accent-[#ff7a00]"
        />
        <div className="mt-1 flex justify-between">
          {STOPS.map((ms) => (
            <span
              key={ms}
              className={cn(
                "text-[8px] tabular-nums transition",
                STOPS[index] === ms ? "font-medium text-accent" : "text-white/35",
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
