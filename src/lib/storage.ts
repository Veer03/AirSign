"use client";

import { del, get, set } from "idb-keyval";
import { DEFAULT_SETTINGS, type Settings } from "./contracts";

const SETTINGS_KEY = "airsign:settings";
const TRANSCRIPT_KEY = "airsign:transcript";

export async function loadSettings(): Promise<Settings> {
  try {
    const saved = await get<Partial<Settings>>(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await set(SETTINGS_KEY, settings);
  } catch {
    // Private mode or blocked storage: the app still works in memory.
  }
}

export async function clearSettings(): Promise<void> {
  try {
    await del(SETTINGS_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export async function clearTranscript(): Promise<void> {
  try {
    await del(TRANSCRIPT_KEY);
  } catch {
    // Ignore storage failures.
  }
}
