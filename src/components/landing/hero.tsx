"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Check,
  Hand,
  Keyboard,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { PerspectiveText } from "./perspective-text";
import { VoxelFallback } from "./voxel-fallback";
import { ConversationPreview } from "./conversation-preview";

const VoxelField = dynamic(
  () => import("./voxel-field").then((module) => module.VoxelField),
  {
    ssr: false,
    loading: () => <VoxelFallback />,
  },
);

const FACTS = [
  { icon: ShieldCheck, label: "Camera stays local" },
  { icon: LockKeyhole, label: "Confirm before speak" },
  { icon: Keyboard, label: "Keyboard path everywhere" },
];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-[var(--border)]"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div
          className="absolute -left-40 top-0 size-[34rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute -right-32 top-24 size-[28rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent-2) 16%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-1 text-[11px] text-muted-foreground">
            <span
              className="size-1.5 rounded-full bg-[var(--accent)]"
              aria-hidden="true"
            />
            Gist, not translation · confirm before speaking
          </span>

          <PerspectiveText className="mt-5">
            <h1
              id="hero-heading"
              className="display-type text-4xl font-semibold leading-[1.02] sm:text-6xl lg:text-[4.1rem]"
            >
              Their hands speak.
              <span className="block text-[var(--accent)]">
                AirSign carries the voice.
              </span>
            </h1>
          </PerspectiveText>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Point the camera at the person signing. AirSign reads the movement,
            frames the gist in plain words, and speaks it once they confirm.
            Their reply comes back as large live captions.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-contrast)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Open the workspace
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <a
              href="#loop"
              className="inline-flex h-11 items-center rounded-full border border-[var(--border-strong)] px-5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              See the loop
            </a>
          </div>

          <ul className="mt-8 grid gap-2 sm:grid-cols-3">
            {FACTS.map((fact) => (
              <li
                key={fact.label}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50 px-3 py-2 text-xs text-muted-foreground"
              >
                <fact.icon
                  className="size-3.5 text-[var(--accent)]"
                  aria-hidden="true"
                />
                {fact.label}
              </li>
            ))}
          </ul>

          <p className="mt-4 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Check
              className="mt-0.5 size-3 shrink-0 text-[var(--success)]"
              aria-hidden="true"
            />
            Not a substitute for a human interpreter · the AI never claims
            certainty.
          </p>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-10 opacity-30 blur-[1px]"
            aria-hidden="true"
          >
            <VoxelField />
          </div>
          <div className="relative">
            <ConversationPreview />
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <Hand className="size-3 text-[var(--accent)]" aria-hidden="true" />
            Demo preview. No camera input in this build.
          </p>
        </div>
      </div>
    </section>
  );
}
