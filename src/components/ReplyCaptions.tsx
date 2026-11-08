"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { PixelPanel } from "./PixelPanel";
import { cn } from "@/lib/utils";

type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function ReplyCaptions() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
    return () => recognitionRef.current?.stop();
  }, []);

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let next = "";
      for (let i = 0; i < event.results.length; i += 1) {
        next += event.results[i][0]?.transcript ?? "";
      }
      setText(next.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <PixelPanel className="flex flex-col">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-2.5">
        <span className="label">reply captions</span>
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          className={cn(
            "label flex items-center gap-1.5 border px-2 py-1 text-[9px] transition",
            listening
              ? "border-accent/70 text-accent"
              : "border-white/25 hover:border-white/60 hover:text-white",
            !supported && "cursor-not-allowed opacity-40",
          )}
        >
          {listening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          {listening ? "stop" : "listen"}
        </button>
      </div>

      <div className="min-h-[7rem] p-4" aria-live="polite" aria-atomic="true">
        {!supported ? (
          <p className="text-xs text-white/40">
            This browser does not support live captions. Type the reply on your own phone, or
            use Chrome or Edge.
          </p>
        ) : text ? (
          <p
            className="leading-snug text-white"
            style={{ fontFamily: "var(--font-atkinson)", fontSize: `${1.15}rem` }}
          >
            {text}
          </p>
        ) : (
          <p className="text-xs text-white/40">
            {listening ? "Listening for the hearing person…" : "Tap Listen so the hearing person can speak."}
          </p>
        )}
      </div>
    </PixelPanel>
  );
}
