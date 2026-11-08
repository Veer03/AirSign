"use client";

import { useEffect, useRef } from "react";

const RADIUS = 520;

/**
 * A soft warm glow that follows the pointer. Purely decorative.
 * The glow is a fixed-size circle moved with a GPU transform, so following
 * the pointer never repaints the page (the old full-screen gradient did).
 * Disabled for reduced-motion users.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        element.style.transform = `translate3d(${x - RADIUS}px, ${y - RADIUS}px, 0)`;
        element.style.opacity = "1";
      });
    };

    const leave = () => {
      element.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      <div
        ref={ref}
        className="absolute left-0 top-0 opacity-0 transition-opacity duration-500 will-change-transform"
        style={{
          width: RADIUS * 2,
          height: RADIUS * 2,
          background: "radial-gradient(circle closest-side, rgba(255,122,0,0.11), transparent 66%)",
        }}
      />
    </div>
  );
}
