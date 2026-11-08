"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Info, ShieldCheck } from "lucide-react";
import { useSettings } from "@/components/providers";
import { SignCamera, useCaptions, useSpeak } from "@/lib/ports";
import type {
  CaptureStatus,
  ContextId,
  ConversationTurn,
  GistResponse,
  SignCapture,
} from "@/lib/contracts";
import { requestCapture } from "@/lib/events";
import { requestGist } from "@/lib/gist-client";
import { clearTranscript } from "@/lib/storage";
import { TopBar } from "./top-bar";
import { SettingsDialog } from "./settings-dialog";
import { Transcript } from "./transcript";
import { GistConfirm } from "./gist-confirm";
import { ReplyBar } from "./reply-bar";
import { KeyboardHints } from "./keyboard-hints";
import type { WorkspaceStatus } from "./status-island";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Workspace() {
  const { settings, update } = useSettings();
  const speak = useSpeak();
  const captions = useCaptions();
  const captionsState = captions.state;
  const startCaptions = captions.start;
  const stopCaptions = captions.stop;
  const clearCaptions = captions.clear;
  const submitTypedReply = captions.submitTyped;

  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [gist, setGist] = useState<GistResponse | null>(null);
  const [gistLoading, setGistLoading] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("idle");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const mockIndexRef = useRef(0);
  const requestIdRef = useRef(0);
  const lastCaptureRef = useRef<SignCapture | null>(null);
  const gistSpokenRef = useRef(false);
  const lastCaptionRef = useRef("");
  const replySourceRef = useRef<"speech" | "typed">("speech");

  const handleCapture = useCallback(async (capture: SignCapture) => {
    lastCaptureRef.current = capture;
    gistSpokenRef.current = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setGist(null);
    setGistLoading(true);

    const result = await requestGist(capture, mockIndexRef.current);
    if (requestId !== requestIdRef.current) return;

    mockIndexRef.current += 1;
    setGist(result);
    setGistLoading(false);
  }, []);

  const handleSpeak = useCallback(() => {
    if (!gist) {
      toast.error("Capture a sign first, then confirm the gist.");
      return;
    }

    if (!gistSpokenRef.current) {
      const turn: ConversationTurn = {
        id: newId(),
        role: "signer",
        text: gist.gist,
        source: "ai",
        uncertain: gist.uncertain,
        confidence: gist.confidence,
        at: Date.now(),
      };
      setTurns((current) => [...current, turn]);
      gistSpokenRef.current = true;
    }

    speak.speak(gist.gist, settings.voice);
  }, [gist, settings.voice, speak]);

  const handleRetry = useCallback(() => {
    const capture = lastCaptureRef.current;
    if (!capture) {
      setGist(null);
      return;
    }
    void handleCapture(capture);
  }, [handleCapture]);

  const handleDismiss = useCallback(() => {
    setGist(null);
    gistSpokenRef.current = false;
  }, []);

  const handleClear = useCallback(() => {
    requestIdRef.current += 1;
    setTurns([]);
    setGist(null);
    setGistLoading(false);
    lastCaptureRef.current = null;
    gistSpokenRef.current = false;
    lastCaptionRef.current = "";
    speak.stop();
    clearCaptions();
    void clearTranscript();
    toast("Conversation cleared.");
  }, [clearCaptions, speak]);

  const handleStartReply = useCallback(() => {
    replySourceRef.current = "speech";
    startCaptions();
  }, [startCaptions]);

  const handleSubmitTyped = useCallback(
    (text: string) => {
      replySourceRef.current = "typed";
      submitTypedReply(text);
    },
    [submitTypedReply],
  );

  const handleContextChange = useCallback(
    (context: ContextId) => update({ context }),
    [update],
  );

  useEffect(() => {
    const final = captionsState.final.trim();
    if (!final) {
      lastCaptionRef.current = "";
      return;
    }
    if (final === lastCaptionRef.current) return;
    lastCaptionRef.current = final;

    const turn: ConversationTurn = {
      id: newId(),
      role: "listener",
      text: final,
      source: replySourceRef.current,
      at: Date.now(),
    };
    setTurns((current) => [...current, turn]);
  }, [captionsState.final]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isField =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        Boolean(target?.isContentEditable);
      const dialogOpen = Boolean(document.querySelector("dialog[open]"));

      if (isField || dialogOpen) return;

      if (event.code === "Space") {
        if (target?.closest("button, a")) return;
        event.preventDefault();
        requestCapture();
        return;
      }

      if (event.key === "Enter") {
        if (target?.closest("button, a")) return;
        event.preventDefault();
        handleSpeak();
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "c") {
        event.preventDefault();
        handleClear();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        if (captionsState.listening) {
          stopCaptions();
        } else {
          handleStartReply();
        }
        document.getElementById("typed-reply")?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    captionsState.listening,
    handleClear,
    handleSpeak,
    handleStartReply,
    stopCaptions,
  ]);

  const status: WorkspaceStatus = speak.state.speaking
    ? "speaking"
    : captionsState.listening
      ? "listening"
      : gistLoading
        ? "thinking"
        : captureStatus === "capturing"
          ? "capturing"
          : gist?.uncertain
            ? "unsure"
            : gist
              ? "ready"
              : captureStatus === "watching" || captureStatus === "ready"
                ? "watching"
                : "idle";

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <TopBar
        context={settings.context}
        onContextChange={handleContextChange}
        onOpenSettings={() => setSettingsOpen(true)}
        status={status}
      />

      <main id="main" className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display-type text-2xl font-semibold sm:text-3xl">
              Two people. One conversation.
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Point the camera at the person signing. Confirm the gist before it
              speaks. Their reply becomes large live captions.
            </p>
          </div>
          <p className="flex max-w-xs items-start gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 size-3 shrink-0 text-[var(--success)]"
              aria-hidden="true"
            />
            Gist, not translation · video stays in this browser.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SignCamera
            context={settings.context}
            captureMs={settings.captureMs}
            enabled
            onCapture={handleCapture}
            onStatus={setCaptureStatus}
          />
          <Transcript turns={turns} />
        </div>

        <div className="mt-4">
          <GistConfirm
            gist={gist}
            loading={gistLoading}
            speaking={speak.state.speaking}
            level={speak.state.level}
            error={speak.state.error}
            onSpeak={handleSpeak}
            onRetry={handleRetry}
            onDismiss={handleDismiss}
            onStop={speak.stop}
          />
        </div>

        <div className="mt-4">
          <ReplyBar
            state={captionsState}
            onStart={handleStartReply}
            onStop={stopCaptions}
            onClear={clearCaptions}
            onSubmitTyped={handleSubmitTyped}
          />
        </div>

        <KeyboardHints />

        <p className="mt-4 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          Camera tracking runs locally. The typed demo capture can exercise the
          conversation flow; sign recognition and live speech are still being
          integrated. Nothing here is a substitute for a human interpreter.
        </p>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
