"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceKey } from "@/lib/contracts";
import { getCachedAudio, setCachedAudio } from "@/lib/storage";

export type SpeakState = "idle" | "loading" | "speaking" | "error";

async function requestAudio(text: string, voice: VoiceKey): Promise<Blob> {
  const response = await fetch("/api/speak", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, voice }),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(data?.error?.message ?? `Speech failed (${response.status})`);
  }

  return response.blob();
}

export function useSpeak() {
  const [state, setState] = useState<SpeakState>("idle");
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const tokenRef = useRef(0);

  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      tokenRef.current += 1;
      audioRef.current?.pause();
      audioRef.current = null;
      releaseUrl();
    };
  }, [releaseUrl]);

  const playBlob = useCallback(
    async (blob: Blob, token: number) => {
      if (token !== tokenRef.current) return;

      releaseUrl();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audio.preload = "auto";
      audioRef.current = audio;

      audio.onended = () => {
        if (token === tokenRef.current) setState("idle");
      };
      audio.onerror = () => {
        if (token === tokenRef.current) {
          setState("error");
          setError("The audio file could not be played.");
        }
      };

      try {
        await audio.play();
        if (token === tokenRef.current) setState("speaking");
      } catch {
        if (token === tokenRef.current) {
          setState("error");
          setError("Tap Speak once to allow audio playback in this browser.");
        }
      }
    },
    [releaseUrl],
  );

  const speak = useCallback(
    async (text: string, voice: VoiceKey) => {
      const clean = text.trim();
      if (!clean) return;

      const token = ++tokenRef.current;
      audioRef.current?.pause();
      setError(null);

      try {
        const cached = await getCachedAudio(clean, voice);
        if (cached) {
          await playBlob(cached, token);
          return;
        }

        setState("loading");
        const blob = await requestAudio(clean, voice);
        await setCachedAudio(clean, voice, blob);
        await playBlob(blob, token);
      } catch (cause) {
        if (token !== tokenRef.current) return;
        setState("error");
        setError(
          cause instanceof Error
            ? cause.name === "TimeoutError"
              ? "Voice timed out. Check the network and try again."
              : cause.message
            : "Speech failed.",
        );
      }
    },
    [playBlob],
  );

  /** Fetch and cache phrases in the background so the first lock is instant. */
  const prewarm = useCallback(async (texts: string[], voice: VoiceKey) => {
    for (const text of texts) {
      const clean = text.trim();
      if (!clean) continue;
      const cached = await getCachedAudio(clean, voice);
      if (cached) continue;

      try {
        const blob = await requestAudio(clean, voice);
        await setCachedAudio(clean, voice, blob);
      } catch {
        // Missing key or offline: the UI already explains this when speaking.
        return;
      }
    }
  }, []);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    audioRef.current?.pause();
    audioRef.current = null;
    setState("idle");
  }, []);

  return { speak, prewarm, stop, state, error, clearError: () => setError(null) };
}
