# AirSign

**A communication helper for quick, high-stakes moments — not an interpreter.**

AirSign helps people who cannot easily speak or be understood in the moment: Deaf and hard-of-hearing signers, non-verbal people, people with speech difficulties, and people facing a language barrier. The example we design for is a pharmacy counter with no interpreter available, where typing is too slow.

A person makes a gesture, AirSign offers a phrase, the person confirms it, and a natural voice speaks it. The hearing person replies by voice and sees large, high-contrast captions.

## Status

**Base site v1 runs, with a two-hand foundation.** The landing page, the `/app` workspace, on-device MediaPipe hand tracking for up to two hands, hold-to-lock, single-hand gestures, two-hand combo phrases, the sentence strip, keyboard fallback, reply captions, and the ElevenLabs `/api/speak` route are implemented. Teach-a-gesture, Gemini gist, and the n8n alert are not built yet. See [docs/ROADMAP.md](docs/ROADMAP.md) for the remaining order.

Recognition is behind a `SignRecognizer` interface (`src/engine/sign-recognizer.ts`). Today a local stub resolves MediaPipe handshapes and two-hand pairs; a trained on-device landmark model can replace it without changing the engine or UI. There is intentionally no `/api/recognize` route in v1 because recognition runs on-device.

### Verified so far

- `npm run build`, `npm run typecheck`, and `npm test` pass (28 tests).
- MediaPipe wasm + `gesture_recognizer.task` load from `public/` and the video-mode pipeline starts with a fake camera device (1280×720, tracking active, no runtime exceptions).
- Unit tests cover hand-tracker continuity, combo matching, the landmark window, and the sign stabilizer.
- Recognition against a real hand, a real two-hand pair, and live ElevenLabs audio still need a manual test with a camera and an API key.

## What it does (planned)

- **On-device hand tracking.** Camera view with a hand-skeleton overlay for one or two hands, mirrored, processed in the browser.
- **Starter gestures.** Built-in handshapes mapped to editable phrases. These are starter gestures, not ASL.
- **Two-hand combos.** Both hands are tracked independently and only a known pair can lock while both are recognized. A single hand still locks normally when the other hand is neutral. The two-hand toggle can be turned off for speed.
- **Hold to lock.** A circular progress ring with an adjustable dwell time (100–900 ms).
- **Live phrase suggestions.** The top candidate and confidence appear while the hand is tracked; the sentence preview updates as phrases lock.
- **Sentence strip.** Locked phrases become chips that can be removed or reordered.
- **Confirm, then speak.** Nothing is spoken until the user confirms. ElevenLabs provides the voice.
- **Reply mode.** The hearing person holds a button and speaks; large captions appear.
- **Teach a gesture.** Record a pose, name a phrase, and match it later with kNN plus a rejection threshold.
- **AI gist.** Gemini joins candidates into one cautious sentence, always labeled as an AI guess with visible uncertainty.

## Privacy

**Video never leaves the browser.** Hand tracking, landmark buffering, and gesture matching run on-device. Only text is sent to the server, and only when the user confirms a phrase or requests a gist.

## Base site

Two routes with one design system:

- `/` — premium landing page: 3D voxel hero, scroll-linked perspective text, scenario coverflow, scroll-triggered feature grid, parallax, card stacks, dynamic-island CTA.
- `/app` — the communication workspace: camera, hold ring, sentence strip, captions, gist card, settings.
- `/api/*` — small server routes for speech, gist, and optional integrations. Keys never reach the client.

The base site is built so features plug in without rewrites: shared contracts, `ports.ts` + mocks, feature flags, design tokens, and reusable motion primitives. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, shadcn/ui, lucide-react |
| Fonts | Atkinson Hyperlegible for captions; Geist/Inter for UI via `next/font` |
| UI motion | `motion` (formerly Framer Motion), import from `motion/react` |
| Complex scroll | GSAP + ScrollTrigger (free for all users) where Motion is awkward |
| 3D | Three.js + React Three Fiber + Drei (landing only, lazy-loaded) |
| Smooth scroll | Lenis (optional, disabled under reduced motion) |
| Voice | ElevenLabs `eleven_flash_v2_5`, `scribe_v2_realtime` |
| LLM | Gemini via `@google/genai` |
| Storage | `idb-keyval` |
| Validation | `zod` |
| Tests | `vitest` |
| Hosting | Render or Vercel (HTTPS required for camera and mic) |

Exact versions are pinned after install and committed in the lockfile. Research notes and current versions: [docs/RESEARCH.md](docs/RESEARCH.md).

## Quick start

```bash
npm install
npm run setup:assets        # copy MediaPipe wasm and download the gesture model
cp .env.example .env.local   # add your own keys
npm run dev
```

Add `ELEVENLABS_API_KEY` to `.env.local` to enable the voice. Without it the app still
tracks gestures and fills the sentence strip, and `/api/speak` returns a clear 503.
Optional: set `ELEVENLABS_VOICE_WARM`, `ELEVENLABS_VOICE_CALM`, and
`ELEVENLABS_VOICE_ENERGETIC` to your own ElevenLabs voice IDs.

Camera and microphone access require HTTPS or `localhost`.

## Repository map

```
docs/            spec, architecture, design, roadmap, research, per-person tasks
public/          self-hosted MediaPipe wasm and gesture model (generated)
scripts/         asset setup
src/app/         routes: landing, workspace, API
src/components/  UI, landing motion components, mocks
src/engine/      camera, MediaPipe recognizer, hand tracker, stabilizers, combos, landmark buffer, sign-recognizer boundary
src/voice/       TTS, captions, audio cache
src/lib/         contracts, schemas, ports, storage, starter phrases
```

## Team lanes

| Lane | Owns | Task file |
|---|---|---|
| P1 Engine | `src/engine/*`, `CameraPanel`, `HoldRing` | [docs/tasks/P1-engine.md](docs/tasks/P1-engine.md) |
| P2 Voice/API | `src/app/api/{speak,gist,scribe-token}/*`, `src/voice/*`, `schemas.ts` | [docs/tasks/P2-voice-api.md](docs/tasks/P2-voice-api.md) |
| P3 UI/Design | `page.tsx`, `layout.tsx`, `globals.css`, components, ports, storage | [docs/tasks/P3-ui.md](docs/tasks/P3-ui.md) |
| P4 Base/Ship | bootstrap, `help-alert`, docs, scripts, deploy, demo, submission | [docs/tasks/P4-ship.md](docs/tasks/P4-ship.md) |

## Docs

- [docs/SPEC.md](docs/SPEC.md) — the original concept and full spec
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — base site, stack, extension points
- [docs/DESIGN.md](docs/DESIGN.md) — premium 3D design system and motion inventory
- [docs/ROADMAP.md](docs/ROADMAP.md) — tiers, feature slices, timeline, gates
- [docs/RESEARCH.md](docs/RESEARCH.md) — what each person must verify
- [docs/GIST_PROMPT.md](docs/GIST_PROMPT.md) — the Gemini prompt
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — lanes, git rules, definition of done
- [docs/tasks/](docs/tasks/) — paste-ready task files per person

## Limits and honesty

- AirSign is **not** an interpreter and **not** ASL translation. It does not translate sign language. The starter gestures and two-hand combos are arbitrary mappings, labeled as such in the UI.
- MediaPipe classifies each hand into 7 static handshapes. It does not understand motion, contact, facial expression, or grammar, so two-hand support is a foundation, not sign-language recognition.
- It is a helper for small moments where no interpreter is available. The honest next step is co-design with Deaf users.
- The AI never claims certainty. It shows candidates and confidence, and says "not sure" when confidence is low.
- Nothing is spoken until the user confirms it.
- We do not invent statistics or user quotes. The unsourced "99% of hearing people" claim must not be used.
- We do not claim more accessibility testing than we actually did.
