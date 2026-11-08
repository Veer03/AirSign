"use client";

import { AlertTriangle, HandHeart, Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const LIMITS = [
  "A short capture, not a continuous conversation. It does not read open-ended signing.",
  "The gist is a guess from coarse candidates. It can be wrong, and it says so.",
  "The signer confirms before it speaks. They are always the author of the sentence.",
  "Not for emergencies. Use a qualified interpreter for anything urgent.",
];

export function Honesty() {
  return (
    <section
      id="limits"
      aria-labelledby="limits-heading"
      className="scroll-mt-20 border-b border-[var(--border)] py-16 sm:py-24"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--amber)]">
            Limits
          </p>
          <h2
            id="limits-heading"
            className="display-type mt-3 text-3xl font-semibold leading-tight sm:text-5xl"
          >
            Not an interpreter. Not ASL translation. A window for small moments.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            The honest version is more useful than a big claim. AirSign frames a
            gist from a short burst of signing and an explicit confirm step. It does
            not understand signing in general.
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--amber)_40%,transparent)] bg-[color-mix(in_srgb,var(--amber)_8%,transparent)] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--amber)_18%,transparent)] text-[var(--amber)]">
              <Users className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Next step: co-design</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                The defaults, the confidence threshold, and the privacy rules
                should be shaped with Deaf users, not guessed for them.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="space-y-3">
          {LIMITS.map((limit, index) => (
            <Reveal key={limit} delay={index * 0.05}>
              <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--amber)_14%,transparent)] text-[var(--amber)]">
                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">{limit}</p>
              </div>
            </Reveal>
          ))}

          <Reveal delay={0.24}>
            <div className="flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]">
                <HandHeart className="size-3.5" aria-hidden="true" />
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                What it is: a conversation window for short, repeated exchanges,
                with spoken output and live captions. Confirm before it speaks.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
