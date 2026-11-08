"use client";

import { Check, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PixelPanel } from "./PixelPanel";

export const PRACTICE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const PRACTICE_NUMBERS = Array.from({ length: 10 }, (_, index) => String(index + 1));
const PRACTICE_POOL = [...PRACTICE_LETTERS, ...PRACTICE_NUMBERS];

export const isPracticeNumber = (target: string) => /^\d+$/.test(target);

/** Random letter or number, never the same one twice in a row. */
export function randomPracticeTarget(current: string | null): string {
  const pool = PRACTICE_POOL.filter((item) => item !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Practice drill: "Practice" highlights a random letter or number; signing it
 * on camera (a camera lock with the same label) shows a green check.
 */
export function PracticeDrill({
  target,
  correct,
  onPractice,
  onPick,
}: {
  target: string | null;
  correct: boolean;
  onPractice: () => void;
  onPick: (target: string) => void;
}) {
  const key = (item: string) => {
    const active = target === item;
    return (
      <button
        key={item}
        type="button"
        aria-pressed={active}
        onClick={() => onPick(item)}
        className={cn(
          "relative grid aspect-square place-items-center border text-sm font-medium transition",
          active && correct && "border-emerald-400 bg-emerald-500 text-black",
          active && !correct && "border-accent bg-accent text-black",
          !active && "border-white/20 text-white/75 hover:border-white/60 hover:text-white",
        )}
      >
        {active && correct ? <Check className="h-4 w-4" strokeWidth={3} /> : item}
      </button>
    );
  };

  return (
    <PixelPanel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label label-title">Practice drill</p>
          <h2 className="mt-1 text-base font-medium">Sign the highlighted key</h2>
        </div>
        <button
          type="button"
          onClick={onPractice}
          className="inline-flex items-center gap-2 bg-accent px-3 py-2 text-xs font-medium uppercase tracking-wider text-black transition hover:bg-accent-soft"
        >
          <Shuffle className="h-3.5 w-3.5" />
          {target ? (correct ? "Next" : "Skip") : "Practice"}
        </button>
      </div>

      <div
        aria-live="polite"
        className={cn(
          "mt-4 flex min-h-[3.25rem] items-center gap-3 border px-3 py-2",
          correct ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/15",
        )}
      >
        {target ? (
          <>
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center text-lg font-medium",
                correct ? "bg-emerald-500 text-black" : "bg-accent text-black",
              )}
            >
              {correct ? <Check className="h-5 w-5" strokeWidth={3} /> : target}
            </span>
            <p className={cn("text-xs leading-snug", correct ? "text-emerald-300" : "text-white/70")}>
              {correct
                ? `Correct — that was ${target}. Press Next for another.`
                : `Sign ${isPracticeNumber(target) ? "the number" : "the letter"} ${target} and hold it until the ring fills.`}
            </p>
          </>
        ) : (
          <p className="text-xs text-white/50">
            Press Practice for a random letter or number, or tap a key to pick one.
          </p>
        )}
      </div>

      <p className="label label-title mt-4 !text-[9px]">letters</p>
      <div className="mt-1.5 grid grid-cols-7 gap-1">{PRACTICE_LETTERS.map(key)}</div>
      <p className="label label-title mt-3 !text-[9px]">numbers</p>
      <div className="mt-1.5 grid grid-cols-5 gap-1">{PRACTICE_NUMBERS.map(key)}</div>
    </PixelPanel>
  );
}
