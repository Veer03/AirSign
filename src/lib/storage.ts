"use client";

import { createStore, get, set } from "idb-keyval";
import type { Settings } from "./contracts";
import { DEFAULT_SETTINGS } from "./contracts";

const appStore = createStore("airsign", "app");
const audioStore = createStore("airsign", "audio");

const SETTINGS_KEY = "settings";

export async function loadSettings(): Promise<Settings> {
  try {
    const stored = await get<Partial<Settings>>(SETTINGS_KEY, appStore);
    return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
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

// Bump the version when the server's TTS request changes (v2: language pinned),
// so clips cached from the old request are not replayed.
const AUDIO_CACHE_VERSION = 2;
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
