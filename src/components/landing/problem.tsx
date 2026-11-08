"use client";

import { Clock, MessageSquareOff, Repeat2 } from "lucide-react";
import { Parallax } from "@/components/motion/parallax";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";

const PROBLEMS = [
  {
    icon: Clock,
    title: "Typing is slow in a live moment",
    body: "At a counter, a queue is waiting. Pulling out a phone and typing a full sentence adds friction to every exchange.",
  },
  {
    icon: MessageSquareOff,
    title: "An interpreter is not always there",
    body: "A pharmacy, a train desk, a restaurant. Most quick conversations do not come with a human interpreter.",
  },
  {
    icon: Repeat2,
    title: "Small misunderstandings add up",
    body: "One missed word turns into a repeat, then a guess. The cost is not dramatic. It is constant.",
  },
];

export function Problem() {
  return (
    <section
      aria-labelledby="problem-heading"
      className="relative overflow-hidden border-b border-[var(--border)] py-16 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Parallax className="absolute -left-24 top-12" distance={44}>
          <div
            className="size-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--amber) 16%, transparent), transparent 70%)",
            }}
          />
        </Parallax>
        <Parallax className="absolute -right-20 bottom-0" distance={-38}>
          <div
            className="size-80 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
            }}
          />
        </Parallax>
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--amber)]">
            The moment
          </p>
          <h2
            id="problem-heading"
            className="display-type mt-3 text-3xl font-semibold leading-tight sm:text-4xl"
          >
            A pharmacy counter. No interpreter. A question that cannot wait.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            AirSign is built for the short, ordinary exchanges where a phone
            keyboard is too slow and a human interpreter is not in the room. The
            hearing person holds the device. The signer signs. One conversation
            stays on one screen.
          </p>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {PROBLEMS.map((problem, index) => (
            <Reveal key={problem.title} delay={index * 0.06}>
              <TiltCard max={5}>
                <div className="panel flex items-start gap-3 p-4 sm:p-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--amber)]">
                    <problem.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{problem.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {problem.body}
                    </p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
