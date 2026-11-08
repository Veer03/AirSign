"use client";

import type { GistResponse, SignCapture } from "./contracts";
import { flags } from "./flags";
import { fallbackGist } from "./gist";

/**
 * Client entry point for the gist step.
 *
 * With mocks enabled (the default) it returns curated demo data so the
 * conversation reads correctly. With mocks off it calls /api/gist and falls
 * back to a local reading if the route is unavailable.
 */
export async function requestGist(
  capture: SignCapture,
  mockIndex: number,
): Promise<GistResponse> {
  // Real hand tracking currently produces landmarks, not verified sign labels.
  // Do not let the mock gist pretend it interpreted the live camera capture.
  if (capture.candidates.length === 0) return fallbackGist(capture);

  if (flags.useMocks) {
    const { mockGist } = await import("./mock-signs");
    // Small delay so the "thinking" state is visible in the demo.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return mockGist(capture.context, mockIndex);
  }

  try {
    const response = await fetch("/api/gist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: capture.context, capture }),
    });

    if (!response.ok) {
      return fallbackGist(capture);
    }

    return (await response.json()) as GistResponse;
  } catch {
    return fallbackGist(capture);
  }
}
