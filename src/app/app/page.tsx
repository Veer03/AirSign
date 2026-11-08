"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, CameraOff, Sparkles, SwitchCamera } from "lucide-react";
import type { GestureEvent, GestureId, Settings } from "@/lib/contracts";
import { DEFAULT_SETTINGS } from "@/lib/contracts";
import { makeGestureEvent, phraseForGesture, phraseForKey, STARTER_PHRASES } from "@/lib/starter-phrases";
import { loadSettings, saveSettings } from "@/lib/storage";
import { useSpeak } from "@/voice/useSpeak";
import { CameraPanel } from "@/components/CameraPanel";
import { PixelBackdrop } from "@/components/PixelBackdrop";
import { PixelPanel } from "@/components/PixelPanel";
import { SentenceStrip } from "@/components/SentenceStrip";
import { SettingsBar } from "@/components/SettingsBar";
import { ReplyCaptions } from "@/components/ReplyCaptions";
import { RepeatWaitPanel } from "@/components/RepeatWaitPanel";
import { ASLAlphabetPractice } from "@/components/ASLAlphabetPractice";
import { ASLNumberPractice } from "@/components/ASLNumberPractice";
import { isPracticeNumber, PracticeDrill, randomPracticeTarget } from "@/components/PracticeDrill";
import type { CameraFacing } from "@/engine/camera";
import { useIsMobile } from "@/lib/useIsMobile";

export default function WorkspacePage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("user");
  const isMobile = useIsMobile();
  const [alphabetMode, setAlphabetMode] = useState(false);
  const [numberMode, setNumberMode] = useState(false);
  const [sideTab, setSideTab] = useState<"interpret" | "practice">("interpret");
  // Charts start closed and close again whenever the Practice tab is opened.
  const [alphabetPracticeOpen, setAlphabetPracticeOpen] = useState(false);
  const [numberPracticeOpen, setNumberPracticeOpen] = useState(false);
  const [practiceTarget, setPracticeTarget] = useState<string | null>(null);
  const [practiceCorrect, setPracticeCorrect] = useState(false);
  const practiceTargetRef = useRef<string | null>(null);
  const [chips, setChips] = useState<GestureEvent[]>([]);
  const [last, setLast] = useState<GestureEvent | null>(null);
  const [voiceConfigured, setVoiceConfigured] = useState<boolean | null>(null);

  const settingsRef = useRef(settings);

  useEffect(() => {
    practiceTargetRef.current = practiceTarget;
  }, [practiceTarget]);

  /** Highlight a practice key and switch the camera to the matching recognizer. */
  const startPractice = useCallback((target: string) => {
    setPracticeTarget(target);
    setPracticeCorrect(false);
    const number = isPracticeNumber(target);
    setNumberMode(number);
    setAlphabetMode(!number);
    setCameraOn(true);
  }, []);

  const switchSideTab = useCallback((tab: "interpret" | "practice") => {
    setSideTab(tab);
    if (tab === "practice") {
      setAlphabetPracticeOpen(false);
      setNumberPracticeOpen(false);
    } else {
      setPracticeTarget(null);
      setPracticeCorrect(false);
    }
  }, []);
  const { speak, prewarm, state: speakState, error: speakError, clearError } = useSpeak();

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    void loadSettings().then((stored) => {
      if (cancelled) return;
      setSettings(stored);
      settingsRef.current = stored;
      setSettingsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    void saveSettings(settings);
  }, [settings, settingsLoaded]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/speak", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setVoiceConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (!cancelled) setVoiceConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Warm the starter phrase audio so the first lock is effectively instant.
  useEffect(() => {
    if (!voiceConfigured) return;
    void prewarm(
      STARTER_PHRASES.map((phrase) => phrase.text),
      settings.voice,
    );
  }, [voiceConfigured, settings.voice, prewarm]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleLock = useCallback(
    (event: GestureEvent) => {
      // Practice: a camera lock on the highlighted letter/number counts as correct.
      if (event.source === "camera" && practiceTargetRef.current === event.label) {
        setPracticeCorrect(true);
      }
      setChips((prev) => [...prev, event]);
      setLast(event);
      if (settingsRef.current.autoSpeak) {
        void speak(event.phrase, settingsRef.current.voice);
      }
    },
    [speak],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      const alphabetKey =
        alphabetMode && /^[a-z]$/i.test(event.key)
          ? phraseForGesture(`ASL_${event.key.toUpperCase()}` as GestureId)
          : undefined;
      const phrase = alphabetKey ?? phraseForKey(event.key);
      if (!phrase) return;
      event.preventDefault();
      handleLock(makeGestureEvent(phrase, 1, "keyboard"));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [alphabetMode, handleLock]);

  const speakSentence = useCallback(() => {
    const sentence = chips.map((chip) => chip.phrase).join(". ");
    if (sentence) void speak(sentence, settingsRef.current.voice);
  }, [chips, speak]);

  return (
    <div
      data-reduced={settings.reducedMotion ? "true" : "false"}
      data-camera-active={cameraOn ? "true" : "false"}
      data-theme="matte"
      className="relative min-h-screen"
    >
      <PixelBackdrop matte />

      <header className="sticky top-0 z-30 border-b border-white/70 bg-black/90">
        <div className="mx-auto flex h-[52px] max-w-[1500px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="h-3 w-3 bg-accent" />
              <span className="font-mono text-sm font-medium uppercase tracking-[0.22em]">AirSign</span>
            </Link>
            <span className="hidden h-4 w-px bg-white/25 sm:block" />
            <Link
              href="/"
              className="label hidden items-center gap-1 transition hover:text-white sm:flex"
            >
              <ArrowLeft className="h-3 w-3" /> home
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="label hidden md:block">
              {alphabetMode
                ? "ASL alphabet + Wow sign"
                : numberMode
                  ? "ASL numbers 1–10"
                  : "starter gestures · not sign language"}
            </span>
            {isMobile ? (
              <button
                type="button"
                onClick={() => setFacing((value) => (value === "user" ? "environment" : "user"))}
                aria-label={facing === "user" ? "Switch to rear camera" : "Switch to front camera"}
                className="inline-flex items-center gap-1.5 border border-white/40 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white/80 transition hover:border-white hover:text-white"
              >
                <SwitchCamera className="h-3.5 w-3.5" />
                {facing === "user" ? "Rear" : "Front"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setCameraOn((value) => !value)}
              className="inline-flex items-center gap-2 whitespace-nowrap bg-accent px-3 py-2 sm:px-4 text-xs font-medium uppercase tracking-[0.12em] text-black transition hover:bg-accent-soft"
            >
              {cameraOn ? <CameraOff className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
              {cameraOn ? "Stop camera" : "Start camera"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-3 py-4 sm:px-4 sm:py-6 lg:grid-cols-12">
        <section className="min-w-0 space-y-5 lg:col-span-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
                Make a gesture. It speaks.
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-white/50">
                {alphabetMode
                  ? "Hold a static ASL letter pose or the Wow pose until the ring fills. The result is added and spoken if speak-on-lock is on."
                  : numberMode
                    ? "Hold a static ASL number handshape until the ring fills. The result is added and spoken if speak-on-lock is on."
                    : "Hold a starter pose — one hand, or a matching pair — until the ring fills. Speak-on-lock is "}
                {!alphabetMode && !numberMode ? (
                  <span className={settings.autoSpeak ? "text-accent" : "text-white/80"}>
                    {settings.autoSpeak ? "on" : "off"}
                  </span>
                ) : null}
                {alphabetMode || numberMode
                  ? " The video never leaves this device."
                  : ". The video never leaves this device."}
              </p>
            </div>
            <span className="label flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent" />
              {voiceConfigured ? "voice prewarmed" : "keyboard demo ready"}
            </span>
          </div>

          <CameraPanel
            enabled={cameraOn}
            dwellMs={settings.dwellMs}
            repeatMs={settings.repeatMs}
            twoHands={settings.twoHands}
            alphabetMode={alphabetMode}
            practiceLetter={practiceTarget && !isPracticeNumber(practiceTarget) ? practiceTarget : null}
            practiceNumber={practiceTarget && isPracticeNumber(practiceTarget) ? practiceTarget : null}
            onAlphabetModeChange={setAlphabetMode}
            facing={facing}
            numberMode={numberMode}
            onNumberModeChange={setNumberMode}
            onEnable={() => setCameraOn(true)}
            onDisable={() => setCameraOn(false)}
            onLock={handleLock}
          />

          <RepeatWaitPanel
            value={settings.repeatMs}
            onChange={(repeatMs) => updateSettings({ repeatMs })}
          />

          <PixelPanel className="p-4">
            <SettingsBar
              settings={settings}
              onChange={updateSettings}
              voiceConfigured={voiceConfigured}
            />
          </PixelPanel>

          {voiceConfigured === false ? (
            <div className="border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
              Voice is not configured. Add{" "}
              <code className="bg-black/40 px-1 py-0.5 font-mono">ELEVENLABS_API_KEY</code> to{" "}
              <code className="bg-black/40 px-1 py-0.5 font-mono">.env.local</code> and restart
              the dev server. Gestures, the live candidate, and the sentence strip work right
              now.
            </div>
          ) : null}

          {speakError ? (
            <div className="flex items-start justify-between gap-4 border border-red-500/40 bg-red-500/10 px-4 py-3">
              <p className="text-xs leading-relaxed text-red-200">{speakError}</p>
              <button
                type="button"
                onClick={clearError}
                className="label shrink-0 !text-red-300 transition hover:!text-white"
              >
                dismiss
              </button>
            </div>
          ) : null}
        </section>

        <aside className="min-w-0 space-y-5 lg:col-span-4">
          <div className="grid grid-cols-2 border border-white/25" role="tablist" aria-label="Side panel">
            {(["interpret", "practice"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={sideTab === tab}
                onClick={() => switchSideTab(tab)}
                className={
                  sideTab === tab
                    ? "bg-accent px-3 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-black"
                    : "px-3 py-2.5 text-xs uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/10 hover:text-white"
                }
              >
                {tab === "interpret" ? "Interpret" : "Practice"}
              </button>
            ))}
          </div>

          {sideTab === "practice" ? (
            <>
              <ASLAlphabetPractice open={alphabetPracticeOpen} onOpenChange={setAlphabetPracticeOpen} />
              <ASLNumberPractice open={numberPracticeOpen} onOpenChange={setNumberPracticeOpen} />
              <PracticeDrill
                target={practiceTarget}
                correct={practiceCorrect}
                onPractice={() => startPractice(randomPracticeTarget(practiceTarget))}
                onPick={startPractice}
              />
            </>
          ) : (
            <>
              <PixelPanel className="p-5">
                <div className="flex items-center justify-between">
                  <span className="label">last locked phrase</span>
                  <span className="label uppercase">
                    {last
                      ? `${last.source} · ${
                          last.hands === 2
                            ? "2h"
                            : last.side === "left"
                              ? "left"
                              : last.side === "right"
                                ? "right"
                                : "1h"
                        }`
                      : "—"}
                  </span>
                </div>

                <p
                  className="mt-4 min-h-[2.5rem] text-white"
                  style={{
                    fontFamily: "var(--font-atkinson)",
                    fontSize: `${1.65 * settings.textScale}rem`,
                    lineHeight: 1.15,
                  }}
                >
                  {last ? last.phrase : <span className="text-white/30">Waiting for a gesture</span>}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
                  <span className="label">
                    {last ? `${Math.round(last.confidence * 100)}% confidence` : "keys 1–9 work now"}
                  </span>
                  <span className="label flex items-center gap-1.5">
                    <span
                      className={
                        settings.autoSpeak && last
                          ? "h-1.5 w-1.5 rounded-full bg-accent"
                          : "h-1.5 w-1.5 rounded-full bg-white/25"
                      }
                    />
                    {settings.autoSpeak && last ? "spoken on lock" : "manual speak"}
                  </span>
                </div>
              </PixelPanel>

              <SentenceStrip
                chips={chips}
                onRemove={(id) => setChips((prev) => prev.filter((chip) => chip.id !== id))}
                onClear={() => {
                  setChips([]);
                  setLast(null);
                }}
                onSpeak={speakSentence}
                speaking={speakState}
                autoSpeak={settings.autoSpeak}
              />

              <ReplyCaptions />
            </>
          )}
        </aside>
      </main>

      <footer className="mx-auto max-w-[1500px] px-4 pb-8">
        <p className="label text-center !text-[9px]">
          not an interpreter · starter gestures only · nothing is spoken without a lock
        </p>
      </footer>
    </div>
  );
}
