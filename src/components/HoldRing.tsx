"use client";

import type { RefObject } from "react";

export function HoldRing({
  ringRef,
  dwellMs,
  repeatWaitMs,
  armed,
}: {
  ringRef: RefObject<HTMLDivElement | null>;
  dwellMs: number;
  /** Milliseconds left before the same held signal may speak again. */
  repeatWaitMs: number;
  armed: boolean;
}) {
  const waiting = repeatWaitMs > 0;

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
      <div className="relative h-24 w-24">
        <div ref={ringRef} className="hold-ring absolute inset-0 rounded-full" aria-hidden />
        <div className="absolute inset-[9px] grid place-items-center rounded-full border border-white/10 bg-black/80 backdrop-blur-sm">
          <span
            className="label text-center text-[8px] leading-tight"
            style={{ color: waiting || armed ? "#ff7a00" : undefined }}
          >
            {waiting ? (
              <>
                WAIT
                <br />
                {(repeatWaitMs / 1000).toFixed(1)} s
              </>
            ) : (
              <>
                {armed ? "LOCKING" : "HOLD"}
                <br />
                {dwellMs} ms
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
