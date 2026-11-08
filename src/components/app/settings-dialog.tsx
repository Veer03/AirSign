"use client";

import { useEffect, useRef } from "react";
import { RotateCcw, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/components/providers";
import { CONTEXTS } from "@/lib/contexts";
import type { ContextId, ThemeId, VoiceKey } from "@/lib/contracts";

const THEMES: { value: ThemeId; label: string }[] = [
  { value: "dark-neon", label: "Dark neon" },
  { value: "high-contrast", label: "High contrast" },
  { value: "light", label: "Light" },
];

const VOICES: { value: VoiceKey; label: string }[] = [
  { value: "warm", label: "Warm" },
  { value: "calm", label: "Calm" },
  { value: "energetic", label: "Energetic" },
];

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { settings, update, reset } = useSettings();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-title"
      className="settings-dialog m-auto max-h-[88dvh] w-[min(94vw,34rem)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--text)] shadow-[var(--shadow-lifted)]"
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === dialogRef.current) onOpenChange(false);
      }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)]">
            <Settings2 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="settings-title" className="text-base font-semibold">
              Settings
            </h2>
            <p className="text-xs text-muted-foreground">
              Saved in this browser with IndexedDB.
            </p>
          </div>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Close settings"
          onClick={() => onOpenChange(false)}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="space-y-6 p-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Theme</legend>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                type="button"
                onClick={() => update({ theme: theme.value })}
                aria-pressed={settings.theme === theme.value}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-2 py-2 text-xs font-medium transition-colors hover:border-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] aria-pressed:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {theme.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="text-scale" className="text-sm font-medium">
              Text size
            </label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.round(settings.textScale * 100)}%
            </span>
          </div>
          <Slider
            id="text-scale"
            min={90}
            max={140}
            step={5}
            value={[Math.round(settings.textScale * 100)]}
            onValueChange={(value) => update({ textScale: value[0] / 100 })}
            aria-label="Text size"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="capture-length" className="text-sm font-medium">
              Capture length
            </label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {(settings.captureMs / 1000).toFixed(1)} s
            </span>
          </div>
          <Slider
            id="capture-length"
            min={1500}
            max={5000}
            step={500}
            value={[settings.captureMs]}
            onValueChange={(value) => update({ captureMs: value[0] })}
            aria-label="Capture length in milliseconds"
          />
          <p className="text-xs text-muted-foreground">
            How long AirSign records a burst of signing before framing the gist.
          </p>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
          <div>
            <label htmlFor="reduced-motion" className="text-sm font-medium">
              Reduce motion
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Turns off parallax, tilt, and entrance animation. Your system
              setting is respected too.
            </p>
          </div>
          <Switch
            id="reduced-motion"
            checked={settings.reducedMotion}
            onCheckedChange={(checked) => update({ reducedMotion: checked })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="voice" className="text-sm font-medium">
              Voice
            </label>
            <Select
              value={settings.voice}
              onValueChange={(value) => update({ voice: value as VoiceKey })}
            >
              <SelectTrigger id="voice" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="context" className="text-sm font-medium">
              Context
            </label>
            <Select
              value={settings.context}
              onValueChange={(value) => update({ context: value as ContextId })}
            >
              <SelectTrigger id="context" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEXTS.map((context) => (
                  <SelectItem key={context.id} value={context.id}>
                    {context.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A prompt hint for the gist. Not a vocabulary.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
          <p className="text-xs text-muted-foreground">
            Gist, not translation. Every AI sentence needs confirmation.
          </p>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>
    </dialog>
  );
}
