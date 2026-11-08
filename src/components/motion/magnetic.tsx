"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "./use-reduced-motion";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

/**
 * Subtle pointer attraction for fine pointers. The child stays fully clickable.
 */
export function Magnetic({ children, className, strength = 10 }: MagneticProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 220, damping: 26, mass: 0.6 });
  const smoothY = useSpring(y, { stiffness: 220, damping: 26, mass: 0.6 });

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: smoothX, y: smoothY }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set(((event.clientX - rect.left) / rect.width - 0.5) * strength);
        y.set(((event.clientY - rect.top) / rect.height - 0.5) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
