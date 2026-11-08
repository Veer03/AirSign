"use client";

import { Captions, Check, Hand, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const STEPS = [
  {
    number: "01",
    icon: Hand,
    title: "Point at the signer",
    body: "The hearing person holds the device. The camera faces the person signing, and hand landmarks are tracked on-device.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Frame the gist",
    body: "A short capture of hand movement becomes coarse candidates. Gemini turns them into one plain first-person sentence — a gist, not a translation.",
  },
  {
    number: "03",
    icon: Captions,
    title: "Confirm, speak, reply",
    body: "Nothing is spoken until the signer confirms. Then the voice speaks it, and the hearing person's reply appears as large live captions.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-heading"
      className="scroll-mt-20 border-b border-[var(--border)] py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            How it works
          </p>
          <h2
            id="how-heading"
            className="display-type mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl"
          >
            Two people. One conversation.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            The loop is short on purpose. Capture, confirm, speak, listen. Every
            step also works with a keyboard or a button.
          </p>
        </Reveal>

        <div className="relative mt-10 grid gap-4 lg:grid-cols-3">
          <div
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-[linear-gradient(90deg,transparent,var(--border-strong),transparent)] lg:block"
            aria-hidden="true"
          />
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.08}>
              <div className="panel relative h-full p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)]">
                    <step.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-6 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 p-4 text-xs text-muted-foreground">
            <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--success)]" aria-hidden="true" />
            AirSign is a conversation window for short moments. It is not an
            interpreter, and it does not translate ASL.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
