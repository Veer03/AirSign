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
| `@react-three/postprocessing` | 3.2.2 | optional; skip by default |
| `lenis` | 1.3.27 | optional smooth scroll |

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

## R10 — Motion and 3D stack (P3)

- Confirm `motion` 14 imports and scroll/layout APIs in Next 16 App Router.
- Confirm GSAP ScrollTrigger integration with React 19 (cleanup, `useGSAP`).
- Confirm R3F 9 + Drei 10 work with React 19 and Next 16 (`dynamic` + `ssr: false`).
- Measure bundle size of Three.js on the landing route.
- Decide Motion vs GSAP per effect: Motion for UI and scroll-linked values; GSAP only for complex timelines.
- Confirm Lenis does not fight native scroll or accessibility.

**Status:** in progress
**Findings:** Motion is the successor to Framer Motion (`motion/react`). GSAP is free for all users. Versions above are current as of Nov 7, 2026.
**Links:** https://motion.dev/docs/react · https://gsap.com/pricing/ · https://r3f.docs.pmnd.rs/

## R11 — Motion performance and accessibility (P3 + P4)

- 60fps on the demo laptop with the voxel hero and scroll effects.
- `prefers-reduced-motion` behaviour for every effect.
- Keyboard access for the coverflow, cube grid, and dynamic island.
- axe/Lighthouse results for `/` and `/app`.
- Behavior on a lower-end phone.

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
