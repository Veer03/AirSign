const VOXELS = [
  { left: "6%", top: "18%", size: 44, dur: "16s", delay: "-2s", tone: "warm" },
  { left: "14%", top: "64%", size: 22, dur: "12s", delay: "-7s", tone: "cool" },
  { left: "24%", top: "34%", size: 64, dur: "20s", delay: "-11s", tone: "cool" },
  { left: "38%", top: "12%", size: 18, dur: "10s", delay: "-3s", tone: "warm" },
  { left: "52%", top: "70%", size: 34, dur: "18s", delay: "-9s", tone: "cool" },
  { left: "63%", top: "26%", size: 26, dur: "13s", delay: "-5s", tone: "warm" },
  { left: "72%", top: "58%", size: 56, dur: "22s", delay: "-14s", tone: "cool" },
  { left: "83%", top: "20%", size: 20, dur: "11s", delay: "-1s", tone: "warm" },
  { left: "90%", top: "72%", size: 40, dur: "17s", delay: "-8s", tone: "cool" },
  { left: "45%", top: "82%", size: 16, dur: "9s", delay: "-4s", tone: "warm" },
] as const;

export function PixelBackdrop({ dense = false }: { dense?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="pixel-grid grid-drift absolute inset-0 opacity-80" />
      <div className="backdrop-beam absolute inset-0" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgba(255,122,0,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_82%_78%,rgba(120,180,255,0.06),transparent_75%)]" />

      {VOXELS.map((voxel, index) => (
        <span
          key={index}
          className="pixel-voxel"
          style={{
            left: voxel.left,
            top: voxel.top,
            width: voxel.size,
            height: voxel.size,
            ["--dur" as string]: voxel.dur,
            ["--delay" as string]: voxel.delay,
            opacity: dense ? 0.6 : 0.42,
            borderColor:
              voxel.tone === "warm"
                ? "rgba(255,122,0,0.5)"
                : "rgba(255,255,255,0.34)",
          }}
        />
      ))}

      <div className="scanlines absolute inset-0 opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/70" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(0,0,0,0.85))]" />
    </div>
  );
}
