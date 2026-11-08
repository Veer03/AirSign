"use client";

import { motion } from "motion/react";
import {
  Camera,
  Captions,
  Keyboard,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";

const FEATURES = [
  {
    icon: Camera,
    title: "On-device tracking",
    body: "Hand landmarks are tracked in the browser. Video never leaves the device.",
  },
  {
    icon: Timer,
    title: "Short capture",
    body: "A 2–4 second burst, with a progress ring, so the signer knows exactly when to start and stop.",
  },
  {
    icon: Sparkles,
    title: "AI gist, not translation",
    body: "Gemini frames one cautious sentence from coarse candidates. It never claims to understand signing in general.",
  },
  {
    icon: ShieldCheck,
    title: "Confirm before speak",
    body: "Nothing is spoken until the signer presses Speak. Low confidence shows Not sure and alternatives.",
  },
  {
    icon: Captions,
    title: "Large live captions",
    body: "The hearing person's reply appears in a large, high-contrast panel with a typed fallback.",
  },
  {
    icon: Keyboard,
    title: "Keyboard everywhere",
    body: "Space to capture, Enter to speak, R to reply, C to clear. Every action has a button too.",
  },
];

export function FeatureGrid() {
  const reduced = useReducedMotion();

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 border-b border-[var(--border)] py-16 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            The build
          </p>
          <h2
            id="features-heading"
            className="display-type mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl"
          >
            Small features, chosen carefully.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every part of the loop has a keyboard path and a reduced-motion
            fallback. The demo runs on typed mocks; the ports are ready for real
            modules.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const card = (
              <TiltCard max={5} className="h-full">
                <div className="panel flex h-full flex-col p-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)]">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              </TiltCard>
            );

            if (reduced) {
              return <div key={feature.title}>{card}</div>;
            }

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 26, rotateX: 10, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ transformPerspective: 900 }}
              >
                {card}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
