"use client";

import { useSettings } from "@/components/providers";

/**
 * True when the user asked for reduced motion or the operating system did.
 * Motion components read this and render a static fallback.
 */
export function useReducedMotion(): boolean {
  const { motionReduced } = useSettings();
  return motionReduced;
}
