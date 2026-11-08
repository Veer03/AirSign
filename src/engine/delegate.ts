"use client";

export type Delegate = "GPU" | "CPU";

const STORAGE_KEY = "airsign:delegate";

/** Saved user choice, or null for "auto" (GPU, falling back to CPU). */
export function savedDelegate(): Delegate | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "GPU" || value === "CPU" ? value : null;
  } catch {
    return null;
  }
}

export function saveDelegate(delegate: Delegate) {
  try {
    window.localStorage.setItem(STORAGE_KEY, delegate);
  } catch {
    // Private mode: the choice just won't persist.
  }
}

/**
 * Which MediaPipe delegates to try, in order. `?delegate=cpu|gpu` in the URL
 * wins, then the saved toggle, then GPU with CPU fallback. CPU helps machines
 * where WebGL is software-rendered (slow and can return junk labels).
 */
export function preferredDelegates(): Delegate[] {
  if (typeof window !== "undefined") {
    const forced = new URLSearchParams(window.location.search).get("delegate")?.toUpperCase();
    if (forced === "CPU" || forced === "GPU") return [forced, forced === "GPU" ? "CPU" : "GPU"];
  }
  const saved = savedDelegate();
  if (saved === "CPU") return ["CPU"];
  return ["GPU", "CPU"];
}

let filterInstalled = false;

/**
 * MediaPipe's wasm prints routine INFO/WARNING lines through console.error,
 * which the Next dev overlay shows as errors. Downgrade those to console.debug.
 */
export function quietMediaPipeLogs() {
  if (filterInstalled || typeof window === "undefined") return;
  filterInstalled = true;
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && /^(INFO|WARNING|W\d{4}|I\d{4}):?\s|^Created TensorFlow Lite/.test(first)) {
      console.debug("[mediapipe]", ...args);
      return;
    }
    original(...args);
  };
}
