export const REQUEST_CAPTURE_EVENT = "airsign:request-capture";

/**
 * Ask the signer camera to start a capture. Used by the global Space shortcut
 * so the keyboard path and the button path hit the same code.
 */
export function requestCapture(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REQUEST_CAPTURE_EVENT));
}
