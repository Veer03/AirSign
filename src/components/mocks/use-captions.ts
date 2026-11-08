"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaptionState } from "@/lib/contracts";

const SCRIPTED_REPLIES = [
  "Sure — do you have a prescription with you?",
  "It's on the second shelf, next to the pain relief.",
  "No problem. Take your time.",
  "I can check the back for you.",
  "That will be eight fifty, please.",
];

export type CaptionsController = {
  state: CaptionState;
  start: () => void;
  stop: () => void;
  submitTyped: (text: string) => void;
  clear: () => void;
};

type CaptionOptions = { supported?: boolean };

/**
 * Mock live captions. It scripts a short reply word by word so the caption
 * panel can be built against the same shape a real Scribe session will use.
 * A typed reply path is always available.
 */
export function useCaptions(options?: CaptionOptions): CaptionsController {
  const supported = options?.supported ?? true;
  const [state, setState] = useState<CaptionState>({
    listening: false,
    supported,
    interim: "",
    final: "",
  });
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const replyIndex = useRef(0);

  const clearTimers = useCallback(() => {
    timeouts.current.forEach((timeout) => clearTimeout(timeout));
    timeouts.current = [];
  }, []);

  const start = useCallback(() => {
    clearTimers();

    if (!supported) {
      setState({
        listening: false,
        supported: false,
        interim: "",
        final: "",
        error: "Live captions are not available here. Use the typed reply instead.",
      });
      return;
    }

    const reply = SCRIPTED_REPLIES[replyIndex.current % SCRIPTED_REPLIES.length];
    replyIndex.current += 1;
    const words = reply.split(" ");

    setState({ listening: true, supported: true, interim: "", final: "" });

    words.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setState((current) => ({
          ...current,
          interim: words.slice(0, index + 1).join(" "),
        }));
      }, 420 + index * 220);
      timeouts.current.push(timeout);
    });

    const finalTimeout = setTimeout(() => {
      setState({
        listening: false,
        supported: true,
        interim: "",
        final: reply,
      });
    }, 420 + words.length * 220 + 520);
    timeouts.current.push(finalTimeout);
  }, [clearTimers, supported]);

  const stop = useCallback(() => {
    clearTimers();
    setState((current) => ({
      ...current,
      listening: false,
      interim: "",
    }));
  }, [clearTimers]);

  const submitTyped = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setState((current) => ({
        ...current,
        error: "Type a reply first, then send it.",
      }));
      return;
    }

    clearTimers();
    setState({
      listening: false,
      supported,
      interim: "",
      final: trimmed,
    });
  }, [clearTimers, supported]);

  const clear = useCallback(() => {
    clearTimers();
    setState({
      listening: false,
      supported,
      interim: "",
      final: "",
    });
  }, [clearTimers, supported]);

  useEffect(() => clearTimers, [clearTimers]);

  return { state, start, stop, submitTyped, clear };
}
