# Research checklist

Each person verifies their items and records the answer, a link, and a date. Do not rely on this file for unverified claims. Anything marked VERIFY in `SPEC.md` belongs here until someone confirms it.

Status values: `open`, `in progress`, `confirmed`, `dropped`.

Write your own findings in `docs/research/<lane>.md` and tell P4 to link them here. This file stays the index.

## Confirmed stack (Nov 7, 2026)

Checked against the npm registry and official docs. Pin exact versions after install.

| Package | Latest seen | Notes |
|---|---|---|
| `next` | 16.4.5 | App Router, route handlers |
| `react` / `react-dom` | 19.3.1 | |
| `tailwindcss` | 4.3.5 | CSS-first config |
| `motion` | 14.10.1 | formerly Framer Motion; import from `motion/react` |
| `gsap` | 3.15.1 | free for all users, including plugins |
| `three` | 0.187.0 | |
| `@react-three/fiber` | 9.8.2 | React 19 compatible |
| `@react-three/drei` | 10.7.9 | `AsciiRenderer`, `ContactShadows`, controls |
| `@mediapipe/tasks-vision` | 1.2.2 | HandLandmarker / GestureRecognizer |
| `@google/genai` | 3.0.0 | Gemini SDK |
| `@elevenlabs/react` | 1.21.1 | Scribe hook |

Skiper UI's documented prerequisites: Next.js, Tailwind, React, Motion (`framer-motion`), GSAP, `clsx`, `tailwind-merge`, `lucide-react`, `react-use-measure`. Its free components require attribution; Pro components are paid. We use it as inspiration and build original components.

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

- HandLandmarker vs GestureRecognizer in VIDEO mode inside Next.js.
- Worker versus main thread. GPU delegate support.
- Frame rate on the demo laptop.
- Lighting tests in the actual venue.
- Self-hosted wasm + model paths.

**Status:** open
**Findings:**
**Links:**

## R3 — Gemini (P2)

- Exact current free Flash model ID on our key. Docs list `gemini-3.8-flash` (stable) and `gemini-3.5-flash-lite`.
- Free-tier rate limits and quota.
- Structured JSON output parameters in `@google/genai` 3.0.0 (`responseMimeType`, `responseSchema`).
- Confirm the model accepts a compact numeric landmark summary and returns the schema.
- Timeout behaviour and error shapes.

**Status:** in progress
**Findings:** The model docs on Nov 7, 2026 list Gemini 3.8 Flash as the current stable Flash model, with text/image/audio/video/PDF input. Gemini 2.5 is deprecated. Use `GEMINI_MODEL=gemini-3.8-flash` and verify on our key.
**Links:** https://ai.google.dev/gemini-api/docs/models

## R4 — Gemini multimodal and privacy (P2 + P4)

- Can Gemini accept an image or a short video clip? Yes, per the model docs.
- Do we send pixels? **No, by default.** Landmarks only. A single still frame is opt-in and off by default.
- If still-frame sharing ships: confirm the exact request shape, the downscale step, and the updated privacy copy.
- Never stream video to Gemini Live for this build.

**Status:** in progress
**Findings:** Multimodal input is available, but using it would break the "video never leaves the browser" promise. Default to landmarks + text.
**Links:** https://ai.google.dev/gemini-api/docs/models

## R5 — n8n Cloud (P4)

- Webhook trigger plus email or chat node.
- How to demo reliably without SMS setup.

**Status:** open
**Findings:**
**Links:**

## R6 — Accessibility (P3)

- axe or Lighthouse checks.
- ARIA live region behaviour for the transcript and captions.
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
- `getUserMedia` behaviour on iOS Safari.

**Status:** open
**Findings:**
**Links:**

## R9 — Sign vocabulary (P1 + P4)

- Confirm each demo sign from a reliable source or a signer.
- Check any public dataset license before using it.
- Do not demo signs we cannot verify.
- Record which signs the demo uses and who verified them.

**Status:** open
**Findings:**
**Links:**

## R10 — Motion and 3D stack (P3)

- Confirm `motion` 14 imports and scroll/layout APIs in Next 16 App Router.
- Confirm GSAP ScrollTrigger integration with React 19 (cleanup, `useGSAP`).
- Confirm R3F 9 + Drei 10 work with React 19 and Next 16 (`dynamic` + `ssr: false`).
- Measure bundle size of Three.js on the landing route.
- Confirm Lenis does not fight native scroll or accessibility.

**Status:** in progress
**Findings:** Motion is the successor to Framer Motion (`motion/react`). GSAP is free for all users. Versions above are current as of Nov 7, 2026.
**Links:** https://motion.dev/docs/react · https://gsap.com/pricing/ · https://r3f.docs.pmnd.rs/

## R11 — Motion performance and accessibility (P3 + P4)

- 60fps on the demo laptop with the voxel backdrop and scroll effects.
- `prefers-reduced-motion` behaviour for every effect.
- Keyboard access for the pipeline demo, cube grid, and dynamic island.
- axe/Lighthouse results for `/` and `/app`.
- Behaviour on a lower-end phone.

**Status:** open
**Findings:**
**Links:**

## R12 — Skiper UI and references (P3)

- Which interaction patterns to recreate (not copy).
- Licensing: free components need attribution; Pro is paid.
- Decide the original component list for the base site.
- Confirm no proprietary code or assets are copied.

**Status:** in progress
**Findings:** Skiper UI is a shadcn registry built on Next.js, Tailwind, Motion, and GSAP. Free components require attribution; Pro requires a license.
**Links:** https://skiper-ui.com/docs/quick-start · https://skiper-ui.com/

## R13 — Gist quality (P2 + P3 + P4)

- Test the prompt with real signers if possible. At minimum, test with 3 people making the demo signs.
- Measure: does the gist stay faithful? Does it invent facts?
- Tune the confidence threshold (start at 0.6).
- Decide when to show "Not sure" instead of a sentence.
- Record 5 example inputs and outputs for the Devpost.

**Status:** open
**Findings:**
**Links:**

## R14 — Capture UX (P1 + P3)

- How long should a capture be? Start at 3 s; test 2–4 s.
- Does the signer know when to start and stop? Countdown + ring.
- What happens if no hand is detected? Clear retry.
- Does the listener need a second screen? Keep one device for the demo.

**Status:** open
**Findings:**
**Links:**

## R15 — Honesty review (P4 + all)

- Read every user-facing string. Remove "translator", "translation", "understands sign language".
- Confirm "AI gist — please confirm" appears wherever an AI sentence appears.
- Confirm "not a substitute for a human interpreter" appears on both routes.
- Confirm no invented statistics or quotes.
- Confirm the privacy copy matches what the network tab shows.

**Status:** open
**Findings:**
**Links:**
