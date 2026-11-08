"use client";

import { cn } from "@/lib/utils";

export type WorkspaceStatus =
  | "idle"
  | "watching"
  | "capturing"
  | "thinking"
  | "ready"
  | "listening"
  | "speaking"
  | "unsure";

const STATUS_MAP: Record<
  WorkspaceStatus,
  { label: string; dot: string; text: string; pulse: boolean }
> = {
  idle: {
    label: "Idle",
    dot: "bg-[var(--muted)]",
    text: "text-muted-foreground",
    pulse: false,
  },
  watching: {
    label: "Watching hands",
    dot: "bg-[var(--accent)]",
    text: "text-[var(--accent)]",
    pulse: true,
  },
  capturing: {
    label: "Capturing",
    dot: "bg-[var(--accent)]",
    text: "text-[var(--accent)]",
    pulse: true,
  },
  thinking: {
    label: "Framing gist",
    dot: "bg-[var(--amber)]",
    text: "text-[var(--amber)]",
    pulse: true,
  },
  ready: {
    label: "Please confirm",
    dot: "bg-[var(--amber)]",
    text: "text-[var(--amber)]",
    pulse: false,
  },
  listening: {
    label: "Listening",
    dot: "bg-[var(--success)]",
    text: "text-[var(--success)]",
    pulse: true,
  },
  speaking: {
    label: "Speaking",
    dot: "bg-[var(--accent)]",
    text: "text-[var(--accent)]",
    pulse: true,
  },
  unsure: {
    label: "Not sure",
    dot: "bg-[var(--amber)]",
    text: "text-[var(--amber)]",
    pulse: false,
  },
};

export function StatusIsland({ status }: { status: WorkspaceStatus }) {
  const item = STATUS_MAP[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-medium",
        item.text,
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        {item.pulse ? (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-60",
              item.dot,
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex size-2 rounded-full", item.dot)} />
      </span>
      {item.label}
    </div>
  );
}
