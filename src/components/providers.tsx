"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/contracts";
import { loadSettings, saveSettings } from "@/lib/storage";

type SettingsContextValue = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  ready: boolean;
  systemReduced: boolean;
  motionReduced: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applySettings(settings: Settings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.classList.toggle("dark", settings.theme !== "light");
  root.style.setProperty("--text-scale", String(settings.textScale));
  root.dataset.reducedMotion = String(settings.reducedMotion);
  try {
    localStorage.setItem("airsign:theme", settings.theme);
  } catch {
    // Storage can be blocked in private mode; the app still works in memory.
  }
}

function subscribeReducedMotion(callback: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const systemReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    let active = true;
    loadSettings().then((loaded) => {
      if (!active) return;
      setSettings(loaded);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    void saveSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update,
      reset,
      ready,
      systemReduced,
      motionReduced: settings.reducedMotion || systemReduced,
    }),
    [settings, update, reset, ready, systemReduced],
  );

  return (
    <SettingsContext.Provider value={value}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster
          position="bottom-right"
          theme={settings.theme === "light" ? "light" : "dark"}
        />
      </TooltipProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside Providers");
  }
  return context;
}
