"use client";

import type { StoredCustomGesture } from "@/lib/storage";
import { PixelPanel } from "./PixelPanel";
import { cn } from "@/lib/utils";

export function CustomGesturePanel({
  gestures,
  captureState,
  captureStatus,
  draftPhrase,
  cameraEnabled,
  onDraftPhraseChange,
  onStartCapture,
  onRemove,
}: {
  gestures: StoredCustomGesture[];
  captureState: "idle" | "countdown" | "capturing" | "saved" | "error";
  captureStatus: string;
  draftPhrase: string;
  cameraEnabled: boolean;
  onDraftPhraseChange: (value: string) => void;
  onStartCapture: () => void;
  onRemove: (id: string) => void;
}) {
  const canCapture =
    cameraEnabled && draftPhrase.trim().length > 0 && captureState !== "countdown" && captureState !== "capturing";

  return (
    <PixelPanel className="space-y-3 p-4">
      <div>
        <p className="label label-title">Custom gestures</p>
        <p className="mt-1 text-sm text-white/70">
          Record your own gesture in this tab, then choose what it says when it appears.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="label label-title">Phrase to say</span>
        <input
          value={draftPhrase}
          onChange={(event) => onDraftPhraseChange(event.target.value)}
          placeholder="e.g. I need water"
          maxLength={80}
          className="w-full border border-white/25 bg-black px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onStartCapture}
          disabled={!canCapture}
          className={cn(
            "inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-medium text-black transition",
            "hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40",
          )}
        >
          {captureState === "countdown" ? "Get ready…" : captureState === "capturing" ? "Capturing…" : "Capture"}
        </button>
        <span className="text-xs text-white/55">
          {!cameraEnabled ? "Turn the camera on first." : "3-second countdown, then perform the full gesture for ~2s (1 or 2 hands, motion captured)."}
        </span>
      </div>

      {captureStatus ? (
        <p
          className={cn(
            "border px-3 py-2 text-xs leading-relaxed",
            captureState === "error"
              ? "border-red-500/40 bg-red-500/10 text-red-200"
              : captureState === "saved"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-white/15 bg-white/[0.04] text-white/70",
          )}
        >
          {captureStatus}
        </p>
      ) : null}

      <div className="space-y-2 border-t border-white/15 pt-3">
        <div className="flex items-center justify-between">
          <span className="label label-title">Saved in custom tab</span>
          <span className="label">{gestures.length}</span>
        </div>
        {gestures.length === 0 ? (
          <p className="text-xs text-white/45">No custom gestures yet.</p>
        ) : (
          <ul className="space-y-2">
            {gestures.map((gesture) => (
              <li key={gesture.id} className="flex items-center justify-between gap-2 border border-white/15 px-3 py-2">
                <div className="min-w-0">
                  <span className="block truncate text-sm text-white">{gesture.label}</span>
                  <span className="label !text-[8px] !text-white/40">
                    {gesture.hands === 2 ? "2 hands" : "1 hand"} · {gesture.frames?.length > 1 ? "motion" : "pose"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(gesture.id)}
                  className="label shrink-0 border border-white/20 px-2 py-1 transition hover:border-red-400/60 hover:text-red-300"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PixelPanel>
  );
}
