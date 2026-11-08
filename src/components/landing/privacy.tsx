"use client";

import { Database, LockKeyhole, ScanFace, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const POINTS = [
  {
    icon: ScanFace,
    title: "On-device hand tracking",
    body: "The camera feed is processed in the browser. It is not uploaded, recorded, or stored.",
  },
  {
    icon: Database,
    title: "Numbers, not pixels",
    body: "Only normalized hand-landmark numbers, coarse candidates, and text are sent to the server. No frames, no video, no audio.",
  },
  {
    icon: LockKeyhole,
    title: "Confirm gate",
    body: "Text leaves the device only when the signer presses Speak. Nothing is spoken on their behalf before that.",
  },
];

export function Privacy() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="relative scroll-mt-20 overflow-hidden border-b border-[var(--border)] py-16 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-lines opacity-25" />
        <div
          className="absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--success) 12%, transparent), transparent 68%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--success)]">
            Privacy
          </p>
          <h2
            id="privacy-heading"
            className="display-type mt-3 text-3xl font-semibold leading-tight sm:text-5xl"
          >
            Video never leaves your browser. Only landmark numbers and text do.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            The demo sends nothing at all. When the real camera and Gemini modules
            land, the same rule applies: local video, explicit confirm, no silent
            uploads.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--success)_40%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-3 py-1.5 text-xs text-[var(--success)]">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Demo mode: nothing is captured or sent
          </div>
        </Reveal>

        <div className="grid gap-3">
          {POINTS.map((point, index) => (
            <Reveal key={point.title} delay={index * 0.06}>
              <div className="panel flex items-start gap-3 p-4 sm:p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--success)]">
                  <point.icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{point.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {point.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
