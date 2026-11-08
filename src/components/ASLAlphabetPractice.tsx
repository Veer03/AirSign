"use client";

import Image from "next/image";
import { PixelPanel } from "./PixelPanel";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function ASLAlphabetPractice({
  open,
  onOpenChange,
  target,
  onTargetChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: string | null;
  onTargetChange: (letter: string | null) => void;
}) {
  return (
    <PixelPanel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">Practice tool</p>
          <h2 className="mt-1 text-base font-medium">ASL alphabet chart</h2>
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
            Pick a letter, copy its handshape from the chart, then hold it in front of the camera.
          </p>
          <div className="max-h-[45vh] overflow-y-auto border border-white/15 bg-white p-2">
            <Image
              src="/asl-alphabet-chart.png"
              alt="ASL alphabet handshape chart from A to Z"
              width={1000}
              height={1500}
              sizes="(min-width: 1024px) 28vw, 90vw"
              className="h-auto w-full"
            />
          </div>
          <div className="grid grid-cols-7 gap-1" aria-label="Choose a letter to practice">
            {LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                aria-pressed={target === letter}
                onClick={() => onTargetChange(target === letter ? null : letter)}
                className={`aspect-square border text-sm font-medium transition ${
                  target === letter
                    ? "border-accent bg-accent text-black"
                    : "border-white/20 text-white/75 hover:border-white/60 hover:text-white"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="min-h-5 text-xs text-accent">
            {target ? `Practice ${target} — turn on ASL A–Z and match the handshape.` : "Choose a letter to practice."}
          </p>
        </div>
      ) : null}
    </PixelPanel>
  );
}
