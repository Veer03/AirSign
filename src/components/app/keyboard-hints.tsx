"use client";

const HINTS: { keys: string[]; label: string }[] = [
  { keys: ["Space"], label: "capture a sign" },
  { keys: ["Enter"], label: "confirm and speak" },
  { keys: ["R"], label: "reply / stop listening" },
  { keys: ["C"], label: "clear the conversation" },
  { keys: ["Esc"], label: "close a dialog" },
];

export function KeyboardHints() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-3 text-xs text-muted-foreground">
      <span className="font-medium text-[var(--text)]">Keyboard</span>
      {HINTS.map((hint) => (
        <span key={hint.label} className="inline-flex items-center gap-1.5">
          <span className="flex items-center gap-0.5">
            {hint.keys.map((key) => (
              <kbd
                key={key}
                className="rounded border border-[var(--border-strong)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]"
              >
                {key}
              </kbd>
            ))}
          </span>
          {hint.label}
        </span>
      ))}
    </div>
  );
}
