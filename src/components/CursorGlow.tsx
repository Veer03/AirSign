"use client";

import { useEffect, useRef } from "react";

/**
 * A soft warm glow that follows the pointer. Purely decorative, CSS-only paint.
 * Disabled for reduced-motion users.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--mx", `${event.clientX}px`);
        element.style.setProperty("--my", `${event.clientY}px`);
        element.style.opacity = "1";
      });
    };

    const leave = () => {
      element.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[5] opacity-0 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(520px circle at var(--mx, 50%) var(--my, 30%), rgba(255,122,0,0.11), transparent 66%)",
      }}
    />
  );
}
