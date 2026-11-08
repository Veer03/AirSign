"use client";

import { Volume2 } from "lucide-react";
import type { Settings, VoiceKey } from "@/lib/contracts";
import { cn } from "@/lib/utils";

const VOICES: Array<{ id: VoiceKey; label: string }> = [
  { id: "warm", label: "Warm" },
  { id: "calm", label: "Calm" },
  { id: "energetic", label: "Energetic" },
];

export function SettingsBar({
  settings,
  onChange,
  voiceConfigured,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  voiceConfigured: boolean | null;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
      <label className="flex flex-col gap-1.5">
        <span className="label label-title">voice</span>
        <select
          value={settings.voice}
          onChange={(event) => onChange({ voice: event.target.value as VoiceKey })}
          className="h-9 border border-white/25 bg-black px-2 text-sm text-white outline-none transition hover:border-white/50"
        >
          {VOICES.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="label label-title">speak immediately</span>
        <button
          type="button"
          role="switch"
          aria-checked={settings.autoSpeak}
          onClick={() => onChange({ autoSpeak: !settings.autoSpeak })}
          className={cn(
            "flex h-9 w-[4.5rem] items-center border px-1 transition",
            settings.autoSpeak
              ? "border-accent/70 bg-accent/15"
              : "border-white/25 bg-black",
          )}
        >
          <span
            className={cn(
              "grid h-7 w-8 place-items-center text-[10px] font-medium transition",
              settings.autoSpeak
                ? "translate-x-[2.1rem] bg-accent text-black"
                : "translate-x-0 bg-white/15 text-white/60",
            )}
          >
            {settings.autoSpeak ? "on" : "off"}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label label-title">two-hand phrases</span>
        <button
          type="button"
          role="switch"
          aria-checked={settings.twoHands}
          onClick={() => onChange({ twoHands: !settings.twoHands })}
          className={cn(
            "flex h-9 w-[4.5rem] items-center border px-1 transition",
            settings.twoHands
              ? "border-accent/70 bg-accent/15"
              : "border-white/25 bg-black",
          )}
        >
          <span
            className={cn(
              "grid h-7 w-8 place-items-center text-[10px] font-medium transition",
              settings.twoHands
                ? "translate-x-[2.1rem] bg-accent text-black"
                : "translate-x-0 bg-white/15 text-white/60",
            )}
          >
            {settings.twoHands ? "on" : "off"}
          </span>
        </button>
      </div>

      <label className="flex min-w-[10rem] flex-col gap-1.5">
        <span className="label label-title">
          hold to lock <span className="text-white/80">{settings.dwellMs} ms</span>
        </span>
        <input
          type="range"
          min={100}
          max={900}
          step={50}
          value={settings.dwellMs}
          onChange={(event) => onChange({ dwellMs: Number(event.target.value) })}
          className="h-9 w-full accent-[#ff7a00]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label label-title">text size</span>
        <input
          type="range"
          min={0.9}
          max={1.5}
          step={0.1}
          value={settings.textScale}
          onChange={(event) => onChange({ textScale: Number(event.target.value) })}
          className="h-9 w-24 accent-[#ff7a00]"
        />
      </label>

      <button
        type="button"
        onClick={() => onChange({ reducedMotion: !settings.reducedMotion })}
        className={cn(
          "h-9 border px-3 text-xs transition",
          settings.reducedMotion
            ? "border-accent/60 text-accent"
            : "border-white/25 text-white/60 hover:border-white/50",
        )}
      >
        Reduced motion {settings.reducedMotion ? "on" : "off"}
      </button>

      <span className="label flex items-center gap-1.5 pb-2">
        <Volume2 className="h-3 w-3" />
        {voiceConfigured === null
          ? "checking voice…"
          : voiceConfigured
            ? "elevenlabs ready"
            : "no elevenlabs key"}
      </span>
    </div>
  );
}
