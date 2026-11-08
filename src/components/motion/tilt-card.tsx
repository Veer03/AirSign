"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "./use-reduced-motion";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  max?: number;
};

/**
 * Pointer tilt for fine pointers only. Touch devices get a static card.
 */
export function TiltCard({ children, className, max = 7 }: TiltCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 260, damping: 30, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 260, damping: 30, mass: 0.8 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [max, -max]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-max, max]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
        pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
