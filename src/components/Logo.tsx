import { cn } from "@/lib/utils";

/**
 * AirSign mark: a raised open hand drawn on an 18×18 pixel grid (matching the
 * site's pixel style), with two motion ticks for "signing in the air".
 * Keep in sync with src/app/icon.svg.
 */
const HAND: Array<[number, number, number, number]> = [
  // fingers: index, middle, ring, pinky
  [5, 3, 2, 7],
  [8, 1, 2, 9],
  [11, 2, 2, 8],
  [14, 5, 2, 5],
  // palm
  [5, 9, 11, 5],
  // thumb, angled out
  [1, 7, 2, 2],
  [2, 9, 2, 2],
  [3, 10, 2, 3],
  // heel of the hand
  [6, 14, 9, 1],
  [7, 15, 7, 2],
];

const MOTION: Array<[number, number, number, number]> = [
  [0, 2, 3, 1],
  [1, 4, 2, 1],
];

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className={cn("h-5 w-5 shrink-0", className)}
    >
      <g className="fill-accent">
        {HAND.map(([x, y, w, h]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g className="fill-white/70">
        {MOTION.map(([x, y, w, h]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  );
}

/** Mark + wordmark, as used in the headers. The hand gives a small wave on hover. */
export function Logo() {
  return (
    <span className="group flex items-center gap-2.5">
      <LogoMark className="origin-bottom transition-transform duration-300 group-hover:-rotate-12 motion-reduce:transition-none" />
      <span className="font-mono text-sm font-medium uppercase tracking-[0.22em]">
        Air<span className="text-accent">Sign</span>
      </span>
    </span>
  );
}
