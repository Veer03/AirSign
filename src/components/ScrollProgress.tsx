"use client";

import { useEffect, useRef } from "react";

/**
 * Thin accent bar at the top of the page that tracks scroll position.
 * Writes the transform directly instead of setting React state, so scrolling
 * never triggers a re-render.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[2px] bg-white/10">
      <div
        ref={barRef}
        className="h-full origin-left bg-accent transition-transform duration-150 ease-out"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
