"use client";

import { useEffect, useState } from "react";
import { Hand, Lock, Volume2 } from "lucide-react";
import { PixelPanel } from "@/components/PixelPanel";
import { cn } from "@/lib/utils";

const PHASE_MS = 1800;

const DEMOS = [
  { gesture: "Thumbs up", phrase: "Thumbs up", tag: "1 hand", voice: "~0.3 s" },
  { gesture: "Both palms", phrase: "I need help", tag: "2 hands", voice: "~0.4 s" },
  { gesture: "Pointing up", phrase: "One moment please", tag: "1 hand", voice: "~0.3 s" },
  { gesture: "Double victory", phrase: "Okay", tag: "2 hands", voice: "~0.4 s" },
] as const;

const ROWS = [
  { key: "gesture", icon: Hand },
  { key: "phrase", icon: Lock },
  { key: "voice", icon: Volume2 },
] as const;

export function LiveDemoPanel() {
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;

    const id = window.setInterval(() => setStep((value) => value + 1), PHASE_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  // 0 gesture · 1 phrase · 2 voice · 3 sentence
  const phase = reduced ? 3 : step % 4;
  const index = reduced ? 0 : Math.floor(step / 4) % DEMOS.length;
  const demo = DEMOS[index];

  const history = reduced
    ? DEMOS.slice(0, 2).map((item) => item.phrase)
    : DEMOS.slice(0, index).map((item) => item.phrase);
  const sentence = (phase === 3 ? [...history, demo.phrase] : history).slice(-3);

  const voiceValue =
    phase === 2 ? "speaking" : phase === 3 ? `spoken ${demo.voice}` : "queued";
  const values = [demo.gesture, demo.phrase];

  return (
    <PixelPanel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/15 px-5 py-3">
        <span className="label">live demo</span>
        <span className="label flex items-center gap-1.5 !text-[9px]">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              phase === 0 ? "bg-accent pulse-dot" : "bg-emerald-400",
            )}
          />
          {demo.tag}
        </span>
      </div>

      <div className="p-5">
        <div className="space-y-2.5">
          {ROWS.map((row, rowIndex) => {
            const active = phase >= rowIndex;
            const current = phase === rowIndex;

            return (
              <div
                key={row.key}
                className={cn(
                  "flex items-center justify-between gap-3 border px-3 py-2.5 transition-colors duration-300",
                  active ? "border-white/25 bg-white/[0.06]" : "border-white/10 bg-white/[0.02]",
                  current && "border-accent/60 bg-accent/10",
                )}
              >
                <span className="flex items-center gap-2 text-sm text-white/55">
                  <row.icon
                    className={cn(
                      "h-3.5 w-3.5 transition-colors duration-300",
                      active ? "text-accent" : "text-white/30",
                    )}
                  />
                  {row.key}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-2 text-sm transition-colors duration-300",
                    active ? "text-white" : "text-white/30",
                    row.key === "phrase" && active && "text-accent",
                  )}
                >
                  {row.key === "voice" ? (
                    <>
                      {voiceValue}
                      {phase === 2 ? <Equalizer /> : null}
                    </>
                  ) : (
                    values[rowIndex]
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-[2px] w-full overflow-hidden bg-white/10">
          <div
            key={reduced ? "static" : `${index}-${phase}`}
            className="demo-progress h-full bg-accent"
            style={reduced ? { width: "100%", transform: "none" } : undefined}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="label !text-[8px]">hold → lock</span>
          <span className="label !text-[8px]">
            {phase === 3 ? "added to strip" : "auto-speak on"}
          </span>
        </div>

        <div className="mt-5 border-t border-white/15 pt-4">
          <p className="label mb-2">sentence strip</p>
          <div className="flex min-h-[30px] flex-wrap gap-2">
            {sentence.length === 0 ? (
              <span className="text-xs text-white/30">confirmed phrases land here</span>
            ) : (
              sentence.map((phrase, phraseIndex) => {
                const fresh = phase === 3 && phraseIndex === sentence.length - 1;

                return (
                  <span
                    key={`${phrase}-${phraseIndex}`}
                    className={cn(
                      "border px-2 py-1 text-xs",
                      fresh
                        ? "chip-in border-accent/60 bg-accent/10 text-accent"
                        : "border-white/30 text-white/80",
                    )}
                  >
                    {phrase}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PixelPanel>
  );
}

function Equalizer() {
  return (
    <span aria-hidden className="flex h-3 items-end gap-[2px]">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className="eq-bar h-full w-[2px] bg-accent"
          style={{
            animationDelay: `${bar * 90}ms`,
            animationDuration: `${620 + bar * 70}ms`,
          }}
        />
      ))}
    </span>
  );
}
