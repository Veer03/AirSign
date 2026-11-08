"use client";

import { createStore, get, set } from "idb-keyval";
import type { Settings } from "./contracts";
import { DEFAULT_SETTINGS } from "./contracts";

export type StoredCustomGesture = {
  id: string;
  label: string;
  /** 1 = single-hand gesture, 2 = two-hand gesture (captured/recognized together). */
  hands: 1 | 2;
  /**
   * Recorded landmark frames. Each frame is a normalized vector:
   * - 1 hand: 63 values (21 landmarks × x/y/z), wrist/middle-finger normalized.
   * - 2 hands: 126 values (left-ish hand then right-ish hand by x), each hand normalized.
   * Motion gestures store multiple frames; static captures store one/few frames.
   * Kept as number[][] for IndexedDB/JSON safety.
   */
  frames: number[][];
  createdAt: number;
};

const appStore = createStore("airsign", "app");
const audioStore = createStore("airsign", "audio");

const SETTINGS_KEY = "settings";
const CUSTOM_GESTURES_KEY = "custom-gestures";

export async function loadSettings(): Promise<Settings> {
  try {
    const stored = await get<Partial<Settings>>(SETTINGS_KEY, appStore);
    const settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
    // IndexedDB can contain settings written by older app versions. Never let
    // an outdated voice value reach the speech API.
    if (!["warm", "calm", "energetic"].includes(String(settings.voice))) {
      settings.voice = DEFAULT_SETTINGS.voice;
    }
    // Older versions allowed 10–15 s repeat waits; the slider now caps at 8 s.
    if (!Number.isFinite(settings.repeatMs) || settings.repeatMs < 0) {
      settings.repeatMs = DEFAULT_SETTINGS.repeatMs;
    }
    settings.repeatMs = Math.min(settings.repeatMs, 8000);
    if (![0.2, 0.3, 0.45].includes(Number(settings.customConfidence))) {
      settings.customConfidence = DEFAULT_SETTINGS.customConfidence;
    }
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await set(SETTINGS_KEY, settings, appStore);
  } catch {
    // Private mode / quota — settings still work for the session.
  }
}

export async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return fallbackHash(input);
  }
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fallbackHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

// Bump when TTS language selection changes so old-language clips are not replayed.
const AUDIO_CACHE_VERSION = 3;
const audioKey = (text: string, voice: string) => `audio:v${AUDIO_CACHE_VERSION}:${voice}:${text}`;

export async function getCachedAudio(text: string, voice: string): Promise<Blob | undefined> {
  try {
    return await get<Blob>(audioKey(text, voice), audioStore);
  } catch {
    return undefined;
  }
}

export async function setCachedAudio(text: string, voice: string, blob: Blob): Promise<void> {
  try {
    await set(audioKey(text, voice), blob, audioStore);
  } catch {
    // Audio still plays; caching is an optimization.
  }
}

export async function loadCustomGestures(): Promise<StoredCustomGesture[]> {
  try {
    const stored = await get<unknown[]>(CUSTOM_GESTURES_KEY, appStore);
    if (!Array.isArray(stored)) return [];
    const gestures: StoredCustomGesture[] = [];
    for (const item of stored) {
      if (!item || typeof item !== "object") continue;
      const raw = item as Record<string, unknown>;
      if (typeof raw.id !== "string" || typeof raw.label !== "string") continue;
      const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : Date.now();

      if (Array.isArray(raw.frames)) {
        const frames = raw.frames
          .filter((frame): frame is unknown[] => Array.isArray(frame))
          .map((frame) => frame.filter((v): v is number => typeof v === "number" && Number.isFinite(v)))
          .filter((frame) => frame.length === 63 || frame.length === 126);
        if (frames.length === 0) continue;
        const hands: 1 | 2 = frames[0].length === 126 || raw.hands === 2 ? 2 : 1;
        gestures.push({ id: raw.id, label: raw.label, hands, frames, createdAt });
        continue;
      }

      // Backward compat: old single-vector format.
      if (Array.isArray(raw.vector) && raw.vector.length === 63 && raw.vector.every((v) => typeof v === "number" && Number.isFinite(v))) {
        gestures.push({
          id: raw.id,
          label: raw.label,
          hands: 1,
          frames: [raw.vector as number[]],
          createdAt,
        });
      }
    }
    return gestures;
  } catch {
    return [];
  }
}

export async function saveCustomGestures(gestures: StoredCustomGesture[]): Promise<void> {
  try {
    await set(CUSTOM_GESTURES_KEY, gestures, appStore);
  } catch {
    // Private mode / quota — gestures still work for the session.
  }
}
