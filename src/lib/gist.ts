import type { GistResponse, SignCapture } from "./contracts";

/**
 * Deterministic fallback used when Gemini is unavailable, slow, or malformed.
 * It only joins candidate labels the capture already contains. It never
 * invents a sign, a name, a number, or a medical detail.
 */
export function fallbackGist(capture: SignCapture): GistResponse {
  const labels = capture.candidates
    .map((candidate) => candidate.label.replaceAll("_", " ").trim())
    .filter(Boolean)
    .slice(0, 3);

  if (labels.length === 0) {
    const handDataWasCaptured = Boolean(capture.summary?.length);
    return {
      gist: handDataWasCaptured
        ? "I can track handshapes, but the ASL word classifier is not connected yet."
        : "I'm not sure I caught that. Could you try again?",
      uncertain: true,
      confidence: handDataWasCaptured ? 0.1 : 0.2,
      alternatives: [],
      note: handDataWasCaptured
        ? "This capture contains hand landmarks only. Type the message or connect a classifier trained on ASL words."
        : "No hand movement was captured. Try again or type instead.",
    };
  }

  const joined =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;

  return {
    gist: `I need help with this: ${joined}.`,
    uncertain: true,
    confidence: 0.35,
    alternatives: [],
    note: "AI framing is unavailable. This is a raw reading of the captured signs — please confirm or type instead.",
  };
}
