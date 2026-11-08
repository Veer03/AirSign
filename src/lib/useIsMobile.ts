"use client";

import { useSyncExternalStore } from "react";

type NavigatorWithUAData = Navigator & { userAgentData?: { mobile?: boolean } };

/** True on phones/tablets. `?mobile=1` forces it on for desktop testing. */
export function detectMobile(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("mobile") === "1") return true;

  const nav = navigator as NavigatorWithUAData;
  if (nav.userAgentData?.mobile) return true;
  if (/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|Opera Mini|IEMobile/i.test(nav.userAgent)) {
    return true;
  }
  // iPadOS 13+ reports a desktop Mac user agent; touch support gives it away.
  return nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
}

const subscribe = () => () => {};

/** Hydration-safe: false on the server and first paint, then the real value. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, detectMobile, () => false);
}
