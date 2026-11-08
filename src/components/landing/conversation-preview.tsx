"use client";

import { Hand, Sparkles, Volume2 } from "lucide-react";
import { HandLandmarks } from "@/components/mocks/sign-camera";
import { mockGist } from "@/lib/mock-signs";

export function ConversationPreview() {
  const gist = mockGist("pharmacy", 0);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-lifted)] sm:p-4">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--accent)]" />
          </span>
          Watching hands
        </span>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Demo preview
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] sm:aspect-auto sm:min-h-[15rem]">
          <div className="absolute inset-0 grid-lines opacity-50" aria-hidden="true" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 66%)",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 grid place-items-center p-5">
            <div className="h-full w-full max-w-[160px] animate-breathe">
              <HandLandmarks active />
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-x-4 top-4 h-px animate-scan bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-70"
            aria-hidden="true"
          />
          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] px-2 py-1.5 backdrop-blur">
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Hand className="size-3 text-[var(--accent)]" aria-hidden="true" />
              Capture
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              3.0 s
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,var(--surface-2))] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Signer · AI gist
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug">{gist.gist}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.round(gist.confidence * 100)}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {Math.round(gist.confidence * 100)}%
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--success)_28%,transparent)] bg-[color-mix(in_srgb,var(--success)_7%,var(--surface-2))] p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Listener · live captions
            </p>
            <p className="mt-1 text-sm leading-snug">
              Sure — do you have a prescription with you?
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-[color-mix(in_srgb,var(--amber)_40%,transparent)] bg-[color-mix(in_srgb,var(--amber)_8%,transparent)] px-3 py-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--amber)]">
              <Sparkles className="size-3" aria-hidden="true" />
              AI gist — please confirm
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Volume2 className="size-3 text-[var(--accent)]" aria-hidden="true" />
              Speak
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 px-1">
        <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={index}
              className="w-1 rounded-full bg-[var(--accent)]/70"
              style={{
                height: `${Math.round(25 + Math.abs(Math.sin(index * 0.8)) * 60)}%`,
              }}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Nothing is spoken until someone confirms.
        </p>
      </div>
    </div>
  );
}
