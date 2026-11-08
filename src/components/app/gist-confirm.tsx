"use client";

import {
  AlertTriangle,
  Check,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GistResponse } from "@/lib/contracts";
import { flags } from "@/lib/flags";
import { cn } from "@/lib/utils";

type GistConfirmProps = {
  gist: GistResponse | null;
  loading: boolean;
  speaking: boolean;
  level: number;
  error?: string;
  onSpeak: () => void;
  onRetry: () => void;
  onDismiss: () => void;
  onStop: () => void;
};

function Waveform({ level }: { level: number }) {
  return (
    <div
      className="flex h-8 items-center gap-1"
      aria-hidden="true"
    >
      {Array.from({ length: 18 }).map((_, index) => {
        const base = 0.2 + Math.abs(Math.sin(index * 0.9)) * 0.5;
        const height = Math.round(
          Math.max(0.15, Math.min(1, base * (0.6 + level))) * 100,
        );
        return (
          <span
            key={index}
            className="w-1 rounded-full bg-[var(--accent)] transition-[height] duration-150"
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

export function GistConfirm({
  gist,
  loading,
  speaking,
  level,
  error,
  onSpeak,
  onRetry,
  onDismiss,
  onStop,
}: GistConfirmProps) {
  return (
    <section
      aria-labelledby="gist-heading"
      aria-live="polite"
      className={cn(
        "panel p-4 sm:p-5",
        gist?.uncertain
          ? "border-[color-mix(in_srgb,var(--amber)_45%,transparent)]"
          : "border-[color-mix(in_srgb,var(--accent)_30%,transparent)]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--amber)]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="gist-heading" className="text-sm font-semibold">
              AI gist
            </h2>
            <p className="text-xs text-muted-foreground">
              Framed from a short capture · gist, not translation
            </p>
          </div>
        </div>
        <span className="rounded-full border border-[color-mix(in_srgb,var(--amber)_45%,transparent)] bg-[color-mix(in_srgb,var(--amber)_12%,transparent)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--amber)]">
          Please confirm
        </span>
      </div>

      {flags.useMocks ? (
        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2 text-xs text-muted-foreground">
          Demo mode · speech is simulated; no audio will play.
        </p>
      ) : null}

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="h-7 w-4/5 animate-pulse rounded-lg bg-[var(--surface-2)]" />
          <div className="h-7 w-3/5 animate-pulse rounded-lg bg-[var(--surface-2)]" />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 animate-pulse text-[var(--amber)]" aria-hidden="true" />
            Framing the gist from the capture…
          </p>
        </div>
      ) : !gist ? (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 p-5">
          <p className="text-sm font-semibold">No gist yet.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Camera tracking is ready. Sign recognition is not connected yet, so
            live hand movement will not produce a verified gist. Use typed demo
            capture to preview the confirmation flow.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-[clamp(1.4rem,3.2vw,2.4rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
            {gist.gist}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {gist.uncertain ? "Low confidence" : "Confidence"}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {Math.round(gist.confidence * 100)}%
                </p>
              </div>
              <Progress
                value={Math.round(gist.confidence * 100)}
                aria-label="Gist confidence"
                className="mt-1.5 h-1.5"
              />
            </div>
            {speaking ? (
              <div className="flex items-center gap-3">
                <Waveform level={level} />
                <Button size="sm" variant="outline" onClick={onStop}>
                  <Square aria-hidden="true" />
                  Stop
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={onSpeak} className="sm:justify-self-end">
                <Volume2 aria-hidden="true" />
                Speak it
              </Button>
            )}
          </div>

          {gist.uncertain ? (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[color-mix(in_srgb,var(--amber)_35%,transparent)] bg-[color-mix(in_srgb,var(--amber)_8%,transparent)] p-3">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-[var(--amber)]"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-medium text-[var(--amber)]">
                  Not sure. Try again, or say it another way.
                </p>
                {gist.alternatives.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {gist.alternatives.map((alternative) => (
                      <span
                        key={alternative}
                        className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {alternative}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Check className="mt-0.5 size-3 shrink-0 text-[var(--success)]" aria-hidden="true" />
            {gist.note}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              <X aria-hidden="true" />
              Dismiss
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Nothing is spoken until you press Speak.
            </p>
          </div>
        </>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-xs text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
