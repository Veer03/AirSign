export type ContextId =
  | "pharmacy"
  | "restaurant"
  | "transit"
  | "frontdesk"
  | "general";

export type VoiceKey = "warm" | "calm" | "energetic";
export type ThemeId = "dark-neon" | "high-contrast" | "light";

export type Candidate = { label: string; confidence: number };

/**
 * One short burst of signing. Produced on-device by P1 and sent to /api/gist.
 * `summary` is a compact numeric vector of normalized landmarks. It never
 * contains pixels, images, or video.
 */
export type SignCapture = {
  context: ContextId;
  frames: number;
  durationMs: number;
  candidates: Candidate[];
  summary?: number[];
};

export type GistRequest = { context: ContextId; capture: SignCapture };

export type GistResponse = {
  gist: string;
  uncertain: boolean;
  confidence: number;
  alternatives: string[];
  note: string;
};

export type SpeakRequest = { text: string; voice: VoiceKey };

export type ConversationRole = "signer" | "listener";
export type TurnSource = "ai" | "speech" | "typed";

export type ConversationTurn = {
  id: string;
  role: ConversationRole;
  text: string;
  source: TurnSource;
  uncertain?: boolean;
  confidence?: number;
  at: number;
};

export type Settings = {
  theme: ThemeId;
  textScale: number;
  captureMs: number;
  reducedMotion: boolean;
  voice: VoiceKey;
  context: ContextId;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark-neon",
  textScale: 1,
  captureMs: 3000,
  reducedMotion: false,
  voice: "warm",
  context: "pharmacy",
};

export type CaptureStatus =
  | "idle"
  | "starting"
  | "watching"
  | "capturing"
  | "ready"
  | "denied"
  | "error";

export type SignCameraProps = {
  context: ContextId;
  captureMs: number;
  enabled: boolean;
  onCapture: (capture: SignCapture) => void;
  onStatus?: (status: CaptureStatus) => void;
};

export type SpeakState = { speaking: boolean; level: number; error?: string };

export type CaptionState = {
  listening: boolean;
  supported: boolean;
  interim: string;
  final: string;
  error?: string;
};

export type ApiError = { error: { code: string; message: string } };
