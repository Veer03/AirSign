"use client";

// [alphabet] Camera overlay for fingerspelling mode.

import { Delete, Plus, X } from "lucide-react";
import type { LetterGuess } from "@/engine/alphabet-classifier";
import type { HandSide } from "@/lib/contracts";
import { cn } from "@/lib/utils";

type AlphabetOverlayProps = {
  hand: HandSide | null;
  guesses: LetterGuess[] | null;
  progress: number;
  spelled: string;
  message: string;
  onBackspace: () => void;
  onClear: () => void;
  onCommit: () => void;
};

export function AlphabetOverlay({
  hand,
  guesses,
  progress,
  spelled,
  message,
  onBackspace,
  onClear,
  onCommit,
}: AlphabetOverlayProps) {
  const top = guesses?.[0];
  return (
    <>
      <div className="absolute left-4 top-4 z-10">
        <span className="label flex items-center gap-2 bg-black/60 px-2 py-1 !text-[9px] backdrop-blur">
          <span className={cn("h-1.5 w-1.5 rounded-full", hand ? "bg-emerald-400" : "bg-white/40")} />
          {hand ? `${hand === "unknown" ? "" : `${hand} `}hand` : "show one hand"}
        </span>
      </div>

      <div className="absolute right-4 top-4 z-10 w-[11rem] border border-white/30 bg-black/70 px-3 py-2 backdrop-blur">
        <p className="label !text-[8px]">fingerspelling · hold to add</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <span className="text-4xl font-medium leading-none">{top ? top.letter : "–"}</span>
          <span className="label !text-[9px]">{top ? `${Math.round(top.probability * 100)}%` : ""}</span>
        </div>
        <div className="mt-2 h-1 w-full bg-white/15">
          <div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        {guesses && guesses.length > 1 ? (
          <p className="label mt-1.5 !text-[8px]">
            also: {guesses.slice(1).map((g) => `${g.letter} ${Math.round(g.probability * 100)}%`).join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="absolute inset-x-4 bottom-4 z-10 flex flex-wrap items-center justify-center gap-2">
        <div className="min-w-[10rem] max-w-full border border-white/40 bg-black/70 px-4 py-2 text-center font-mono text-lg tracking-[0.2em] backdrop-blur">
          {spelled || <span className="text-sm tracking-normal text-white/40">{message}</span>}
        </div>
        <button
          type="button"
          onClick={onBackspace}
          aria-label="Delete last letter"
          className="border border-white/50 bg-black/60 p-2.5 transition hover:border-white"
        >
          <Delete className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear spelling"
          className="border border-white/50 bg-black/60 p-2.5 transition hover:border-white"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onCommit}
          disabled={!spelled.trim()}
          className="inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-sm font-medium text-black transition hover:bg-accent-soft disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add word
        </button>
      </div>
    </>
  );
}
