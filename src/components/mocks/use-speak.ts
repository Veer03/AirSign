"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeakState, VoiceKey } from "@/lib/contracts";

export type SpeakController = {
  state: SpeakState;
  speak: (text: string, voice?: VoiceKey) => void;
  stop: () => void;
};

/**
 * Mock speech output. It never plays audio; it models the state a real
 * ElevenLabs session will expose so the UI can be built and tested now.
 */
export function useSpeak(): SpeakController {
  const [state, setState] = useState<SpeakState>({ speaking: false, level: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    setState({ speaking: false, level: 0 });
  }, [clearTimers]);

  const speak = useCallback(
    (text: string, voice?: VoiceKey) => {
      void voice;
      clearTimers();
      const trimmed = text.trim();

      if (!trimmed) {
        setState({
          speaking: false,
          level: 0,
          error: "There is nothing to speak yet. Add a phrase first.",
        });
        return;
      }

      const duration = Math.min(6000, Math.max(1400, trimmed.length * 55));
      const startedAt = Date.now();
      setState({ speaking: true, level: 0.18 });

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const base = 0.38 + 0.42 * Math.abs(Math.sin(elapsed / 190));
        const detail = 0.08 * Math.sin(elapsed / 53);
        setState({
          speaking: true,
          level: Math.min(1, Math.max(0.06, base + detail)),
        });
      }, 90);

      timeoutRef.current = setTimeout(() => {
        clearTimers();
        setState({ speaking: false, level: 0 });
      }, duration);
    },
    [clearTimers],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return { state, speak, stop };
}
