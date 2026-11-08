export function VoxelFallback() {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const height = 22 + ((index * 13) % 46);
    return { height, accent: index % 11 === 0 };
  });

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[var(--surface)]">
      <div className="absolute inset-0 grid-lines opacity-50" aria-hidden="true" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 grid grid-cols-7 content-center justify-items-center gap-2 p-8"
        aria-hidden="true"
      >
        {cells.map((cell, index) => (
          <span
            key={index}
            className="w-4 rounded-[3px] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] sm:w-5"
            style={{
              height: `${cell.height}px`,
              background: cell.accent
                ? "linear-gradient(180deg, color-mix(in srgb, var(--amber) 70%, transparent), color-mix(in srgb, var(--amber) 18%, transparent))"
                : "linear-gradient(180deg, color-mix(in srgb, var(--accent) 55%, transparent), color-mix(in srgb, var(--accent-2) 12%, transparent))",
              boxShadow: "0 0 18px -6px color-mix(in srgb, var(--accent) 50%, transparent)",
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_60%,transparent)] px-4 py-2 text-[11px] text-muted-foreground">
        <span>Static preview · reduced motion</span>
        <span>No camera input</span>
      </div>
    </div>
  );
}
