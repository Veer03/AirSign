# Research checklist

Each person verifies their items and records the answer, a link, and a date. Do not rely on this file for unverified claims. Anything marked VERIFY in `docs/SPEC.md` belongs here until someone confirms it.

Status values: `open`, `in progress`, `confirmed`, `dropped`.

## R1 — ElevenLabs (P2)

- Browser-safe token flow for Scribe Realtime. Exact token endpoint?
- `eleven_flash_v2_5` request options and limits.
- Free-tier credit limits.
- Pick three voice IDs from the dashboard (warm, calm, energetic) and put them in `.env.local`.
- Confirm `useScribe` setup in `@elevenlabs/react`.

**Status:** open
**Findings:**
**Links:**

## R2 — MediaPipe (P1)

- GestureRecognizer in a Web Worker inside Next.js versus main thread.
- GPU delegate support and behaviour.
- Frame rate on the demo laptop.
- Lighting tests in the actual venue.

**Status:** open
**Findings:**
**Links:**

## R3 — Gemini (P2)

- Exact current free Flash model ID in AI Studio.
- Structured JSON output parameters in `@google/genai`.
- Rate limits.

**Status:** open
**Findings:**
**Links:**

## R4 — DeepSpace (P4)

- Can it hold server-side secrets or run a route that calls ElevenLabs?
- Realtime records?
- Deploy URL?
- Go/no-go decision with evidence.

**Status:** open
**Findings:**
**Links:**

## R5 — n8n Cloud (P4)

- Webhook trigger plus email or chat node.
- How to demo reliably without SMS setup.

**Status:** open
**Findings:**
**Links:**

## R6 — Accessibility (P3)

- axe or Lighthouse checks.
- ARIA live region behaviour for captions.
- Contrast checks for all three themes (at least 4.5:1).
- Atkinson Hyperlegible via `next/font/google`.

**Status:** open
**Findings:**
**Links:**

## R7 — Deploy (P4)

- Render versus Vercel.
- HTTPS camera and microphone test on two devices.
- Environment variable setup.

**Status:** open
**Findings:**
**Links:**

## R8 — Browser support (all)

- Web Speech API fallback and camera permissions on Chrome and one other browser.

**Status:** open
**Findings:**
**Links:**

## R9 — Sign vocabulary (Phase 3 only)

- Confirm each sign from reliable sources or a signer.
- Check any public dataset license before using it.
- Do not demo signs we cannot verify.

**Status:** open
**Findings:**
**Links:**
