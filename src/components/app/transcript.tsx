"use client";

import { useEffect, useRef } from "react";
import { Captions, Hand, MessageSquare, Sparkles } from "lucide-react";
import type { ConversationTurn } from "@/lib/contracts";
import { cn } from "@/lib/utils";

type TranscriptProps = {
  turns: ConversationTurn[];
};

function sourceLabel(turn: ConversationTurn): string {
  if (turn.role === "signer") {
    return turn.source === "ai" ? "Signer · AI gist" : "Signer";
  }
  return turn.source === "typed" ? "Listener · typed" : "Listener · live captions";
}

export function Transcript({ turns }: TranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (pausedRef.current) return;
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns.length]);

  return (
    <section
      aria-labelledby="transcript-heading"
      className="panel flex h-full min-h-[22rem] flex-col p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--accent)]">
            <MessageSquare className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="transcript-heading" className="text-sm font-semibold">
              Conversation
            </h2>
            <p className="text-xs text-muted-foreground">
              Both people see the same transcript
            </p>
          </div>
        </div>
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {turns.length} turn{turns.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        onFocus={() => {
          pausedRef.current = true;
        }}
        onBlur={() => {
          pausedRef.current = false;
        }}
        className="no-scrollbar mt-3 flex-1 space-y-3 overflow-y-auto pr-1"
      >
        {turns.length === 0 ? (
          <div className="grid h-full min-h-[14rem] place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 p-6 text-center">
            <div className="max-w-xs">
              <span className="mx-auto grid size-10 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
                <Hand className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold">
                The conversation will appear here.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Capture a short burst of signing. The AI gist waits for
                confirmation before it is spoken or added to the transcript.
              </p>
            </div>
          </div>
        ) : (
          turns.map((turn) => {
            const isSigner = turn.role === "signer";
            return (
              <article
                key={turn.id}
                className={cn(
                  "max-w-[92%] rounded-2xl border p-3",
                  isSigner
                    ? "mr-auto border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,var(--surface-2))]"
                    : "ml-auto border-[color-mix(in_srgb,var(--success)_28%,transparent)] bg-[color-mix(in_srgb,var(--success)_7%,var(--surface-2))]",
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {isSigner ? (
                    <Sparkles
                      className="size-3 text-[var(--accent)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Captions
                      className="size-3 text-[var(--success)]"
                      aria-hidden="true"
                    />
                  )}
                  <span>{sourceLabel(turn)}</span>
                  {isSigner && typeof turn.confidence === "number" ? (
                    <span className="rounded-full border border-[var(--border)] px-1.5 py-0.5 tabular-nums">
                      {Math.round(turn.confidence * 100)}%
                    </span>
                  ) : null}
                  {turn.uncertain ? (
                    <span className="rounded-full border border-[color-mix(in_srgb,var(--amber)_45%,transparent)] px-1.5 py-0.5 text-[var(--amber)]">
                      not sure
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed sm:text-base">
                  {turn.text}
                </p>
              </article>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <p className="mt-3 border-t border-[var(--border)] pt-2 text-[11px] text-muted-foreground">
        AI gist turns are only added after someone presses Speak.
      </p>
    </section>
  );
}
