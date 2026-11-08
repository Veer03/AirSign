import Link from "next/link";
import { ArrowRight, Camera, Hand, Lock, ShieldCheck, Volume2 } from "lucide-react";
import { CursorGlow } from "@/components/CursorGlow";
import { LiveDemoPanel } from "@/components/LiveDemoPanel";
import { Marquee } from "@/components/Marquee";
import { PixelBackdrop } from "@/components/PixelBackdrop";
import { PixelPanel } from "@/components/PixelPanel";
import { Reveal } from "@/components/Reveal";
import { ScrollProgress } from "@/components/ScrollProgress";

const STEPS = [
  {
    icon: Hand,
    title: "Make a starter gesture",
    body: "Seven built-in handshapes map to phrases, and two-hand pairs unlock combo phrases. Starter gestures, not ASL.",
  },
  {
    icon: Lock,
    title: "Hold to lock",
    body: "A ring fills while the pose is steady. Pairs need a longer hold, so a resting second hand will not fire.",
  },
  {
    icon: Volume2,
    title: "Speak it",
    body: "A natural voice says the phrase. Speak-on-lock is on by default; switch it off to confirm first.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Video stays on-device",
    body: "Hand tracking runs in the browser. Only the confirmed phrase text is sent to the server.",
    tag: "privacy",
  },
  {
    icon: Camera,
    title: "The camera follows your hands",
    body: "The preview eases toward the union of both hands so a small gesture or a pair still fills the frame.",
    tag: "tracking",
  },
  {
    icon: Volume2,
    title: "Prewarmed voice",
    body: "Starter phrases are generated and cached when the workspace opens, so the first lock is near-instant.",
    tag: "voice",
  },
  {
    icon: Hand,
    title: "Keyboard fallback",
    body: "Keys 1–7 fire the same events as the camera. The demo survives bad lighting or a denied camera.",
    tag: "resilience",
  },
];

const TICKER = [
  "starter gestures",
  "not sign language",
  "video stays on-device",
  "speak-on-lock",
  "two-hand pairs",
  "keyboard fallback",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <ScrollProgress />
      <CursorGlow />
      <PixelBackdrop dense />

      <noscript>
        <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
      </noscript>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-black/90 backdrop-blur">
        <div className="mx-auto flex h-[52px] max-w-[1500px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-3 w-3 bg-accent" />
            <span className="font-mono text-sm font-medium uppercase tracking-[0.22em]">AirSign</span>
          </Link>
          <nav className="flex items-center gap-5">
            <a href="#how" className="label nav-link hidden transition hover:text-white sm:block">
              how it works
            </a>
            <a href="#honesty" className="label nav-link hidden transition hover:text-white sm:block">
              limits
            </a>
            <Link
              href="/app"
              className="btn-shine inline-flex items-center gap-2 bg-accent px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-black transition hover:bg-accent-soft"
            >
              Open app <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4">
        <section className="grid min-h-[calc(100vh-52px)] items-center gap-10 py-16 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p
              className="label rise mb-6 flex items-center gap-2"
              style={{ animationDelay: "60ms" }}
            >
              <span className="h-px w-10 bg-accent" />
              communication at the speed of a gesture
            </p>

            <h1
              className="rise text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.03em]"
              style={{ animationDelay: "140ms" }}
            >
              Say it now
              <span className="caret" aria-hidden />
              <br />
              <span className="text-white/35">Without typing.</span>
              <br />
              <span className="text-accent">Without a voice.</span>
            </h1>

            <p
              className="rise mt-8 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
              style={{ animationDelay: "220ms" }}
            >
              AirSign turns a small set of starter hand gestures into spoken phrases for
              quick, high-stakes moments — a pharmacy counter, a reception desk, a loud room.
              It is a helper, not an interpreter.
            </p>

            <div
              className="rise mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/app"
                className="btn-shine inline-flex items-center gap-2 bg-accent px-6 py-3 text-sm font-medium text-black transition hover:bg-accent-soft"
              >
                Try the workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="btn-shine inline-flex items-center gap-2 border border-white/35 px-6 py-3 text-sm text-white/80 transition hover:border-white hover:text-white"
              >
                How it works
              </a>
            </div>

            <div
              className="rise mt-10 flex flex-wrap gap-x-8 gap-y-3"
              style={{ animationDelay: "380ms" }}
            >
              {["on-device tracking", "seven starter gestures", "two-hand pairs", "keyboard fallback"].map((item) => (
                <span key={item} className="label flex items-center gap-2">
                  <span className="h-1 w-1 bg-accent" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <Reveal delay={160}>
              <LiveDemoPanel />

              <p className="label mt-4 text-center !text-[9px]">
                starter gestures · not sign language
              </p>
            </Reveal>
          </div>
        </section>

        <div className="-mx-4">
          <Marquee items={TICKER} />
        </div>

        <section id="how" className="border-t border-white/15 py-16">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Three beats, one phrase.</h2>
            <p className="label">01 — how it works</p>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 90} className="h-full">
                <PixelPanel className="accent-line lift group h-full p-6 hover:border-accent/60">
                  <div className="flex items-start justify-between">
                    <step.icon className="h-5 w-5 text-accent transition group-hover:scale-110" />
                    <span className="label">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{step.body}</p>
                </PixelPanel>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-t border-white/15 py-16">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
              Fast where it matters.
            </h2>
            <p className="label">02 — engineering</p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 70} className="h-full">
                <div className="lift group flex h-full gap-4 border border-white/15 bg-white/[0.02] p-5 hover:border-white/40 hover:bg-white/[0.04]">
                  <feature.icon className="mt-0.5 h-5 w-5 shrink-0 text-white/60 transition group-hover:text-accent" />
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium">{feature.title}</h3>
                      <span className="label !text-[8px]">{feature.tag}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/50">{feature.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="honesty" className="border-t border-white/15 py-16">
          <div className="grid gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="label mb-4">03 — limits</p>
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
                Honest by design.
              </h2>
            </Reveal>
            <Reveal
              delay={120}
              className="space-y-4 text-sm leading-relaxed text-white/55 lg:col-span-7"
            >
              <p>
                AirSign does not translate sign language. The built-in poses are arbitrary
                starter gestures that we map to phrases, and the interface says so.
              </p>
              <p>
                Nothing is spoken until a gesture locks. With speak-on-lock on, the phrase is
                spoken as soon as it locks — switch it off when you want an explicit confirm
                step.
              </p>
              <p>
                It is a helper for small moments where no interpreter is available. The honest
                next step is co-design with Deaf users, not a claim that this replaces one.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-white/15 py-20">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Open the workspace.</h2>
              <p className="mt-2 text-sm text-white/50">
                Camera on, hand up, phrase spoken. Keys 1–7 work without a camera.
              </p>
            </div>
            <Link
              href="/app"
              className="btn-shine inline-flex items-center gap-2 bg-accent px-7 py-3.5 text-sm font-medium text-black transition hover:bg-accent-soft"
            >
              Start AirSign <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/15">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="label">AirSign — a communication helper, not an interpreter.</span>
          <span className="label">video never leaves the browser</span>
        </div>
      </footer>
    </div>
  );
}
