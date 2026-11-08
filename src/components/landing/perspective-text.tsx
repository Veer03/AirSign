"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";

type PerspectiveTextProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Scroll-linked perspective tilt. At rest the type is flat and readable;
 * as the hero leaves the viewport it tilts back and fades.
 */
export function PerspectiveText({ children, className }: PerspectiveTextProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const rotateXRaw = useTransform(scrollYProgress, [0, 1], [0, 14]);
  const rotateYRaw = useTransform(scrollYProgress, [0, 1], [0, -4]);
  const zRaw = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const opacityRaw = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);

  const rotateX = useSpring(rotateXRaw, { stiffness: 120, damping: 22, mass: 0.7 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 120, damping: 22, mass: 0.7 });
  const z = useSpring(zRaw, { stiffness: 120, damping: 22, mass: 0.7 });

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ perspective: 1200 }}>
      <motion.div
        style={{
          rotateX,
          rotateY,
          z,
          opacity: opacityRaw,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
