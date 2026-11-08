"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Hand,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HandLandmarks } from "@/components/mocks/sign-camera";
import { CONTEXTS } from "@/lib/contexts";
import type { ContextId } from "@/lib/contracts";
import { mockGist } from "@/lib/mock-signs";
import { cn } from "@/lib/utils";

type DemoState = "idle" | "capturing" | "thinking" | "ready" | "speaking";

const CONTEXT_CHOICES: ContextId[] = ["pharmacy", "transit", "restaurant"];

const STEP_LABELS = ["Capture", "Frame the gist", "Confirm and speak"];

export function PipelineDemo() {
  const [context, setContext] = useState<ContextId>("pharmacy");
  const [state, setState] = useState<DemoState>("idle");
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const gist = mockGist(context, 0);

  useEffect(() => {
    if (state !== "capturing") return;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const value = Math.min(1, (now - startedAt) / 1400);
      setProgress(value);
      if (value < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setState("thinking");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [state]);

  useEffect(() => {
    if (state !== "thinking") return;
    const timer = setTimeout(() => setState("ready"), 750);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state !== "speaking") return;
    const timer = setTimeout(() => setState("ready"), 2200);
    return () => clearTimeout(timer);
  }, [state]);

  function reset(nextContext?: ContextId) {
    setState("idle");
    setProgress(0);
    if (nextContext) setContext(nextContext);
  }

  const step =
    state === "idle" || state === "capturing"
      ? 0
      : state === "thinking"
        ? 1
        : 2;

  const showGist = state === "ready" || state === "speaking";

  return (
    <section
      id="loop"
      aria-labelledby="loop-heading"
      className="scroll-mt-20 border-b border-[var(--border)] py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
              See the loop
            </p>
            <h2
              id="loop-heading"
              className="display-type mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl"
            >
              One short capture. One clear sentence.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              This is the whole product. Capture a burst of signing, let Gemini
              frame the gist, confirm it, and hear it spoken. Then the other
              person replies in captions.
            </p>
          </div>
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-muted-foreground">
            Interactive demo · no camera or API key needed
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel relative overflow-hidden p-3 sm:p-4">
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]"
            >
              <div className="absolute inset-0 grid-lines opacity-50" aria-hidden="true" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 66%)",
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 grid place-items-center p-8">
                <div className="h-full w-full max-w-[240px] animate-breathe">
                  <HandLandmarks active={state !== "idle"} />
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-x-6 top-6 h-px animate-scan bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] opacity-70"
                aria-hidden="true"
              />
              <div className="pointer-events-none absolute inset-3" aria-hidden="true">
                <span className="absolute left-0 top-0 size-5 border-l-2 border-t-2 border-[var(--accent)] opacity-60" />
                <span className="absolute right-0 top-0 size-5 border-r-2 border-t-2 border-[var(--accent)] opacity-60" />
                <span className="absolute bottom-0 left-0 size-5 border-b-2 border-l-2 border-[var(--accent)] opacity-60" />
                <span className="absolute bottom-0 right-0 size-5 border-b-2 border-r-2 border-[var(--accent)] opacity-60" />
              </div>

              {state === "capturing" ? (
                <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_55%,transparent)]">
                  <div className="relative grid size-40 place-items-center">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(var(--accent) ${progress * 360}deg, color-mix(in srgb, var(--text) 10%, transparent) 0deg)`,
                        mask: "radial-gradient(circle, transparent 62%, #000 63%)",
                        WebkitMask:
                          "radial-gradient(circle, transparent 62%, #000 63%)",
                      }}
                      aria-hidden="true"
                    />
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Capturing
                      </p>
                      <p className="mt-1 text-base font-semibold">Keep signing</p>
                      <p className="text-sm tabular-nums text-[var(--accent)]">
                        {Math.round(progress * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] px-2.5 py-1.5 backdrop-blur">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Hand className="size-3 text-[var(--accent)]" aria-hidden="true" />
                  {state === "idle" ? "Watching hands" : state === "capturing" ? "Capturing…" : "Capture ready"}
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  3.0 s
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {state === "idle" || state === "capturing" ? (
                <Button
                  onClick={() => {
                    setProgress(0);
                    setState("capturing");
                  }}
                  disabled={state === "capturing"}
                >
                  <Hand aria-hidden="true" />
                  {state === "capturing" ? "Capturing…" : "Capture a sign"}
                </Button>
              ) : null}

              {state === "thinking" ? (
                <Button disabled>
                  <Sparkles aria-hidden="true" />
                  Framing the gist…
                </Button>
              ) : null}

              {state === "ready" ? (
                <>
                  <Button onClick={() => setState("speaking")}>
                    <Volume2 aria-hidden="true" />
                    Speak it
                  </Button>
                  <Button variant="outline" onClick={() => reset()}>
                    <RotateCcw aria-hidden="true" />
                    Try again
                  </Button>
                </>
              ) : null}

              {state === "speaking" ? (
                <Button variant="outline" onClick={() => setState("ready")}>
                  <Volume2 aria-hidden="true" />
                  Speaking…
                </Button>
              ) : null}

              {state !== "idle" ? (
                <Button variant="ghost" onClick={() => reset()}>
                  <RotateCcw aria-hidden="true" />
                  Reset
                </Button>
              ) : null}
            </div>
          </div>

          <div className="panel flex flex-col p-4 sm:p-5">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {STEP_LABELS.map((label, index) => (
                <li
                  key={label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                    index === step
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]"
                      : index < step
                        ? "border-[color-mix(in_srgb,var(--success)_40%,transparent)] text-[var(--success)]"
                        : "border-[var(--border)]",
                  )}
                >
                  {index < step ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    <span className="tabular-nums">{index + 1}</span>
                  )}
                  {label}
                </li>
              ))}
            </ol>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {CONTEXT_CHOICES.map((id) => {
                const item = CONTEXTS.find((entry) => entry.id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => reset(id)}
                    aria-pressed={context === id}
                    className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-[var(--text)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    {item?.label ?? id}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              {showGist ? (
                <div aria-live="polite">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--amber)]">
                      <Sparkles className="size-3" aria-hidden="true" />
                      AI gist — please confirm
                    </span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {Math.round(gist.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="mt-2 text-[clamp(1.25rem,2.4vw,1.9rem)] font-semibold leading-[1.18]">
                    {gist.gist}
                  </p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.round(gist.confidence * 100)}%` }}
                    />
                  </div>
                  {gist.uncertain ? (
                    <p className="mt-3 text-xs text-[var(--amber)]">
                      Low confidence. Try again, or type it instead.
                    </p>
                  ) : null}
                  {state === "speaking" ? (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex h-6 items-end gap-0.5" aria-hidden="true">
                        {Array.from({ length: 16 }).map((_, index) => (
                          <span
                            key={index}
                            className="w-1 animate-wave rounded-full bg-[var(--accent)]"
                            style={{
                              height: `${Math.round(30 + Math.abs(Math.sin(index)) * 60)}%`,
                              animationDelay: `${index * 40}ms`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[var(--accent)]">
                        Speaking to the listener
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid h-full min-h-[10rem] place-items-center text-center">
                  <div className="max-w-xs">
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
                      {state === "thinking" ? (
                        <Sparkles className="size-5 animate-pulse" aria-hidden="true" />
                      ) : (
                        <Hand className="size-5" aria-hidden="true" />
                      )}
                    </span>
                    <p className="mt-3 text-sm font-semibold">
                      {state === "thinking"
                        ? "Framing the gist…"
                        : "The gist appears here."}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {state === "thinking"
                        ? "Gemini turns the capture into one plain sentence. You still confirm it."
                        : "Press Capture. A short burst of signing becomes one sentence you can confirm or reject."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start justify-between gap-3 border-t border-[var(--border)] pt-3">
              <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                The reply path is the other half: the hearing person speaks, and
                their words become large live captions on the same transcript.
              </p>
              <a
                href="/app"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Open the workspace
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
