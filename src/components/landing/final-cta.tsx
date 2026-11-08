"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Hand } from "lucide-react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Reveal } from "@/components/motion/reveal";

export function FinalCta() {
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden py-16 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent 68%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:px-6">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            Try it
          </p>
          <h2
            id="cta-heading"
            className="display-type mt-3 text-3xl font-semibold leading-tight sm:text-5xl"
          >
            Open the conversation window.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            No keys, no camera, no account. Typed mocks only. Capture a demo sign,
            confirm the gist, hear it spoken, and reply in captions.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <motion.div
            layout={!reduced}
            transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            onFocus={() => setExpanded(true)}
            onBlur={() => setExpanded(false)}
            className="mt-8 inline-flex rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] p-[2px] shadow-[var(--shadow-accent)]"
          >
            <Link
              href="/app"
              className="group inline-flex h-12 items-center gap-3 rounded-full bg-[var(--bg)] px-4 text-sm font-semibold text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <span className="grid size-8 place-items-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[var(--accent-contrast)]">
                <Hand className="size-4" aria-hidden="true" />
              </span>
              <motion.span layout={!reduced} aria-live="polite">
                {expanded ? "Open the conversation window" : "Open AirSign"}
              </motion.span>
              <ArrowRight
                className="size-4 text-[var(--accent)] transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </motion.div>
        </Reveal>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Gist, not translation · confirm before speaking · not a substitute for a
          human interpreter.
        </p>
      </div>
    </section>
  );
}
