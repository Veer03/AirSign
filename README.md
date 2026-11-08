# AirSign

**A conversation window for people who cannot speak — not an interpreter.**

AirSign is built for quick, high-stakes moments where no interpreter is available and typing is too slow. A hearing person holds the device and points the camera at someone signing. AirSign reads the hand movement, uses Gemini to frame **the gist** in one plain sentence, and speaks it once the signer confirms. The hearing person replies by voice, and their words appear as large live captions on the same transcript.

The feeling is an interpreter sitting between two people. The claim is not. AirSign does **not** translate ASL or understand sign language in general.

## Status

**The base site, live hand tracking, and starter gesture classifier are built.** `/` is the landing page. `/app` opens the camera only when you press **Start camera**, then tracks up to two hands locally and displays MediaPipe's general handshape predictions. Speech and live captions still run on typed mocks. An ASL word classifier is the next step.

- Use **Use typed demo capture** if you do not want to grant camera access.
- Camera captures contain normalized landmark numbers only; frames and video are never sent to the server.
- The gist builder has a local fallback. General handshape labels are not treated as ASL words, so live tracking does not produce a guessed sentence.
- Camera tracking is connected through `src/lib/ports.ts`; Gemini and voice integrations remain upcoming.

See [docs/ROADMAP.md](docs/ROADMAP.md) for what comes next and [docs/RESOURCES.md](docs/RESOURCES.md) for accounts, model IDs, and what each API can do.

## The loop

1. **Camera on.** Press **Start camera** for a live view with an on-device, glowing hand-landmark overlay for up to two hands.
2. **Capture a short burst.** The listener taps **Capture hand movement** (or presses Space). AirSign records a short normalized landmark summary; live general handshape predictions appear in the camera panel.
3. **Frame the gist.** Gemini turns context + coarse candidates into one short first-person sentence.
4. **Show it, never speak it yet.** The sentence appears with **"AI gist — please confirm"** and a confidence value.
5. **Confirm → speak.** ElevenLabs (or the browser fallback) speaks it.
6. **Reply → captions.** The hearing person speaks, and their words appear as large live captions.

## Privacy

**Video never leaves the browser.** Hand tracking runs on-device. Only normalized hand-landmark numbers and text are sent to the server. A single still frame is opt-in, off by default, and not part of the MVP.

## Base site (built)

- `/` — landing: 3D perspective headline, conversation-window preview, voxel backdrop, interactive pipeline demo (capture → gist → speak), scroll-triggered feature grid, privacy, limits, CTA.
- `/app` — conversation workspace: signer camera with landmarks and capture ring, two-sided transcript, gist confirm bar, reply captions, typed fallback, settings, keyboard shortcuts.
- `/api/gist` — Gemini gist with zod validation, a 5-second timeout, and a deterministic local fallback.
- `/api/*` — planned routes for speech and optional integrations. Keys never reach the client.

`SignCamera` now uses the on-device MediaPipe implementation through `src/lib/ports.ts`. `useSpeak` and `useCaptions` remain typed mocks until P2 lands. The existing mock camera remains available as a reference implementation, and the real camera includes a typed demo-capture fallback.

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, shadcn/ui, lucide-react |
| Fonts | Inter for UI; Atkinson Hyperlegible for captions, both via `next/font` |
| UI motion | `motion` (formerly Framer Motion), import from `motion/react` |
| 3D | Three.js + React Three Fiber + Drei (landing only, lazy-loaded) |
| Vision | MediaPipe `@mediapipe/tasks-vision` HandLandmarker |
| Voice | ElevenLabs `eleven_flash_v2_5`, Web Speech API for reply captions |
| LLM | Gemini via `@google/genai`, default `gemini-3.8-flash` |
| Storage | `idb-keyval` |
| Validation | `zod` |
| Tests | `vitest` |
| Hosting | Render or Vercel (HTTPS required for camera and mic) |

Exact versions are pinned in the lockfile. Research notes: [docs/RESEARCH.md](docs/RESEARCH.md).

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. After `npm install`, run `npm run setup:assets` once to download the self-hosted MediaPipe models and copy its WASM runtime. Then press **Start camera** in `/app` to test hand tracking and the starter classifier, or use the typed demo capture without camera access. Speech and captions remain mocked.

To try the real Gemini gist, copy `.env.example` to `.env.local` and add `GEMINI_API_KEY`. Without a key, `/api/gist` falls back to a deterministic local sentence.

Camera and microphone access require HTTPS or `localhost`.

Checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Repository map

```
docs/                     spec, resources, architecture, design, roadmap, research, tasks
src/app/                  routes: landing (/), conversation workspace (/app), /api/gist
src/components/landing/   hero, conversation preview, pipeline demo, sections
src/components/app/       workspace, sign camera, transcript, gist confirm, reply bar, settings
src/components/mocks/     typed SignCamera, useSpeak, useCaptions
src/components/motion/    Reveal, TiltCard, Parallax, Magnetic, reduced motion
src/components/ui/        shadcn/ui primitives
src/lib/                  contracts, contexts, mock-signs, gist, ports, storage, flags
```

P1 will add `src/engine/` for camera, landmarks, normalization, and capture. P2 will add `src/voice/` and the remaining API routes for TTS, captions, and Scribe.

## Team lanes

| Lane | Owns | Task file |
|---|---|---|
| P1 Engine | `src/engine/*`, real `SignCamera` | [docs/tasks/P1-engine.md](docs/tasks/P1-engine.md) |
| P2 Voice/API | `src/app/api/*`, `src/voice/*`, `schemas.ts` | [docs/tasks/P2-voice-api.md](docs/tasks/P2-voice-api.md) |
| P3 UI/Design | `page.tsx`, `layout.tsx`, `globals.css`, components, ports, storage | [docs/tasks/P3-ui.md](docs/tasks/P3-ui.md) |
| P4 Base/Ship | bootstrap, `help-alert`, docs, scripts, deploy, demo, submission | [docs/tasks/P4-ship.md](docs/tasks/P4-ship.md) |

## Docs

- [docs/SPEC.md](docs/SPEC.md) — the product spec and honesty rules
- [docs/RESOURCES.md](docs/RESOURCES.md) — accounts, Gemini/MediaPipe/ElevenLabs, what each can do
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — base site, stack, extension points
- [docs/DESIGN.md](docs/DESIGN.md) — design system and motion inventory
- [docs/ROADMAP.md](docs/ROADMAP.md) — tiers, slices, timeline, gates
- [docs/RESEARCH.md](docs/RESEARCH.md) — what each person must verify
- [docs/GIST_PROMPT.md](docs/GIST_PROMPT.md) — the Gemini prompt
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — lanes, git rules, definition of done
- [docs/tasks/](docs/tasks/) — paste-ready task files per person

## Limits and honesty

- AirSign is **not** an interpreter and **not** ASL translation. It frames a gist from a short capture; it does not understand signing in general.
- It reads a short burst of signs, not a continuous conversation.
- Every AI sentence says **"AI gist — please confirm"**. Nothing is spoken until the signer confirms.
- Low confidence shows **"Not sure"** and alternatives instead of a confident sentence.
- The honest next step is co-design with Deaf users.
- We do not invent statistics or user quotes.
- We do not claim more accessibility testing than we actually did.
