"use client";

import { useState } from "react";
import { AudioLines, Captions, Eraser, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CaptionState } from "@/lib/contracts";

type ReplyBarProps = {
  state: CaptionState;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onSubmitTyped: (text: string) => void;
};

export function ReplyBar({
  state,
  onStart,
  onStop,
  onClear,
  onSubmitTyped,
}: ReplyBarProps) {
  const [typed, setTyped] = useState("");
  const [forceUnsupported, setForceUnsupported] = useState(false);
  const supported = state.supported && !forceUnsupported;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitTyped(typed);
    if (typed.trim()) setTyped("");
  }

  const shown = state.interim || state.final;

  return (
    <section
      aria-labelledby="reply-heading"
      className="panel flex flex-col gap-3 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--success)]">
            <Captions className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="reply-heading" className="text-sm font-semibold">
              Listener reply
            </h2>
            <p className="text-xs text-muted-foreground">
              Their words become large live captions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {state.listening ? (
            <Button size="sm" variant="outline" onClick={onStop}>
              <Square aria-hidden="true" />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={onStart} disabled={!supported}>
              <AudioLines aria-hidden="true" />
              Listen
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            disabled={!shown && !state.error}
          >
            <Eraser aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      <div className="min-h-[7rem] rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
        <div aria-live="polite" aria-atomic="true" className="caption-type">
          {shown ? (
            <p className="text-[clamp(1.3rem,2.2vw,2rem)] font-semibold leading-[1.18]">
              {state.interim ? (
                <span className="text-muted-foreground">{state.interim}</span>
              ) : (
                state.final
              )}
            </p>
          ) : (
            <p className="text-[clamp(1rem,1.7vw,1.35rem)] leading-snug text-muted-foreground">
              Press Listen and let the other person speak. Their reply appears
              here, large and readable.
            </p>
          )}
        </div>

        {state.listening ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--success)]">
            <AudioLines className="size-3.5 animate-pulse" aria-hidden="true" />
            Listening in demo mode…
          </p>
        ) : null}
      </div>

      {!supported ? (
        <p
          role="status"
          className="rounded-lg border border-[color-mix(in_srgb,var(--amber)_40%,transparent)] bg-[color-mix(in_srgb,var(--amber)_10%,transparent)] p-3 text-xs text-[var(--amber)]"
        >
          Live captions are not available here. The typed reply below always
          works.
        </p>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-xs text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <label htmlFor="typed-reply" className="sr-only">
          Typed reply
        </label>
        <input
          id="typed-reply"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="Or type the reply you heard"
          className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
        />
        <Button type="submit" size="sm">
          <Send aria-hidden="true" />
          Add reply
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Captions are a helper, not a transcript. If something matters, confirm
          it in writing.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!forceUnsupported) onStop();
            setForceUnsupported((current) => !current);
          }}
          className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-muted-foreground hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {forceUnsupported ? "Reset caption support" : "Demo: unsupported captions"}
        </button>
      </div>
    </section>
  );
}
