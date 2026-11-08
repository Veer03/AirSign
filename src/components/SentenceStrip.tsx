"use client";

import { Trash2, Volume2, X } from "lucide-react";
import type { GestureEvent } from "@/lib/contracts";
import type { SpeakState } from "@/voice/useSpeak";
import { cn } from "@/lib/utils";
import { PixelPanel } from "./PixelPanel";

export function SentenceStrip({
  chips,
  onRemove,
  onClear,
  onSpeak,
  speaking,
  autoSpeak,
}: {
  chips: GestureEvent[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onSpeak: () => void;
  speaking: SpeakState;
  autoSpeak: boolean;
}) {
  const sentence = chips.map((chip) => chip.phrase).join(". ");

  return (
    <PixelPanel className="flex min-h-[15rem] flex-col">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-2.5">
        <span className="label label-title">sentence</span>
        <span className="label">{chips.length} locked</span>
      </div>

      <div className="flex-1 p-4" aria-live="polite" aria-atomic="true">
        {chips.length === 0 ? (
          <div className="grid h-full min-h-[8rem] place-items-center text-center">
            <div>
              <p className="text-sm text-white/45">No phrases yet.</p>
              <p className="mt-1 text-xs text-white/30">
                A locked gesture becomes a chip here. Remove any chip before speaking.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, index) => (
              <span
                key={chip.id}
                className="chip-in group inline-flex items-center gap-2 border border-white/30 bg-white/[0.06] py-1.5 pl-3 pr-1.5 text-sm"
                style={{ animationDelay: `${Math.min(index, 4) * 20}ms` }}
              >
                <span className="label !text-[9px] !text-accent">{index + 1}</span>
                {chip.combo ? (
                  <span className="label border border-accent/50 px-1 !text-[8px] !text-accent">
                    2H
                  </span>
                ) : chip.side === "left" || chip.side === "right" ? (
                  <span className="label border border-white/20 px-1 !text-[8px] !text-white/50">
                    {chip.side === "left" ? "L" : "R"}
                  </span>
                ) : null}
                {chip.phrase}
                <button
                  type="button"
                  onClick={() => onRemove(chip.id)}
                  aria-label={`Remove ${chip.phrase}`}
                  className="grid h-5 w-5 place-items-center text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {chips.length > 0 ? (
        <div className="border-t border-white/15 px-4 py-3">
          <p
            className="font-caption text-lg leading-snug text-white/85"
            style={{ fontFamily: "var(--font-atkinson)" }}
          >
            {sentence}
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-t border-white/15 p-3">
        <button
          type="button"
          onClick={onSpeak}
          disabled={chips.length === 0 || speaking === "loading"}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 bg-accent px-4 py-2.5 text-sm font-medium text-black transition",
            "hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40",
          )}
        >
          <Volume2 className="h-4 w-4" />
          {speaking === "loading"
            ? "Generating voice…"
            : speaking === "speaking"
              ? "Speaking…"
              : autoSpeak
                ? "Speak again"
                : "Speak sentence"}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={chips.length === 0}
          className="inline-flex items-center gap-2 border border-white/25 px-3 py-2.5 text-sm text-white/70 transition hover:border-white/60 hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>
    </PixelPanel>
  );
}
