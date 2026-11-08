"use client";

import Image from "next/image";
import { PixelPanel } from "./PixelPanel";

export function ASLAlphabetPractice({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PixelPanel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label label-title">Practice tool</p>
          <h2 className="mt-1 text-base font-medium">ASL alphabet chart</h2>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className="border border-white/30 px-3 py-2 text-xs uppercase tracking-wider transition hover:border-accent hover:text-accent"
        >
          {open ? "Close" : "Open chart"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs leading-relaxed text-white/60">
            Copy a handshape from the chart, then hold it in front of the camera on the alphabet tab.
          </p>
          <div className="max-h-[45vh] overflow-y-auto border border-white/15 bg-white p-2">
            <Image
              src="/asl-alphabet-chart.png"
              alt="ASL alphabet handshape chart from A to Z"
              width={1000}
              height={1500}
              sizes="(min-width: 1024px) 28vw, 90vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      ) : null}
    </PixelPanel>
  );
}
