"use client";

import Image from "next/image";
import { PixelPanel } from "./PixelPanel";

const NUMBERS = Array.from({ length: 10 }, (_, index) => String(index + 1));

export function ASLNumberPractice({
  open,
  onOpenChange,
  target,
  onTargetChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: string | null;
  onTargetChange: (number: string | null) => void;
}) {
  return (
    <PixelPanel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">Practice tool</p>
          <h2 className="mt-1 text-base font-medium">ASL numbers 1–10</h2>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className="border border-white/30 px-3 py-2 text-xs uppercase tracking-wider transition hover:border-accent hover:text-accent"
        >
          {open ? "Close" : "Open chart"}
        </button>
      </div>
      {open ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs leading-relaxed text-white/60">
            Choose a number, copy its handshape, and hold it in front of the camera.
          </p>
          <div className="max-h-[45vh] overflow-y-auto border border-white/15 bg-white p-2">
            <Image
              src="/asl-numbers-chart.png"
              alt="ASL number handshapes from 1 to 10"
              width={330}
              height={490}
              sizes="(min-width: 1024px) 28vw, 90vw"
              className="h-auto w-full"
            />
          </div>
          <div className="grid grid-cols-5 gap-1" aria-label="Choose a number to practice">
            {NUMBERS.map((number) => (
              <button
                key={number}
                type="button"
                aria-pressed={target === number}
                onClick={() => onTargetChange(target === number ? null : number)}
                className={`aspect-square border text-sm font-medium transition ${
                  target === number
                    ? "border-accent bg-accent text-black"
                    : "border-white/20 text-white/75 hover:border-white/60 hover:text-white"
                }`}
              >
                {number}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="min-h-5 text-xs text-accent">
            {target ? `Practice ${target} — match the handshape in the chart.` : "Choose a number to practice."}
          </p>
        </div>
      ) : null}
    </PixelPanel>
  );
}
