# AirSign

**A communication helper for quick, high-stakes moments — not an interpreter.**

AirSign helps people who cannot easily speak or be understood in the moment: Deaf and hard-of-hearing signers, non-verbal people, people with speech difficulties, and people facing a language barrier. The example we design for is a pharmacy counter with no interpreter available, where typing is too slow.

A person makes a gesture, AirSign offers a phrase, the person confirms it, and a natural voice speaks it. The hearing person replies by voice and sees large, high-contrast captions.

## What it does (planned)

- **On-device hand tracking.** Camera view with a hand-skeleton overlay, mirrored, processed in the browser.
- **Starter gestures.** Built-in gestures mapped to editable phrases. These are starter gestures, not ASL.
- **Hold to lock.** A circular progress ring with an adjustable dwell time (500–2000 ms).
- **Sentence strip.** Locked phrases become chips that can be removed or reordered.
- **Confirm, then speak.** Nothing is spoken until the user confirms. ElevenLabs provides the voice.
- **Reply mode.** The hearing person holds a button and speaks; large captions appear.
- **Teach a gesture.** Record a pose, name a phrase, and match it later with kNN plus a rejection threshold.
- **AI gist.** Gemini joins candidates into one cautious sentence, always labeled as an AI guess with visible uncertainty.

## Privacy

**Video never leaves the browser.** Hand tracking and gesture matching run on-device. Only text is sent to the server, and only when the user confirms a phrase or requests a gist.

## Status

Pre-build. This commit contains the concept, spec, and team docs. The Next.js app has not been scaffolded yet. See [docs/ROADMAP.md](docs/ROADMAP.md) for the build order.

## Quick start (once the app is scaffolded)

```bash
npm install
cp .env.example .env.local   # fill in your own keys
npm run setup:assets         # copy MediaPipe wasm and download the gesture model
npm run dev
```

Camera and microphone access require HTTPS or `localhost`.

## Repository map

```
docs/            spec, roadmap, research checklist, contribution guide, gist prompt
public/          self-hosted MediaPipe wasm and gesture model (generated)
scripts/         asset setup
src/app/         Next.js App Router pages and API routes
src/engine/      camera, worker, normalization, kNN, hold-to-lock
src/voice/       TTS, captions, audio cache
src/components/  UI components
src/lib/         shared contracts, schemas, starter phrases, storage
```

## Team lanes

| Lane | Owns |
|---|---|
| P1 Engine | `src/engine/*` — camera, worker, overlay, hold ring, teach-a-gesture, sign matcher |
| P2 Voice/API | `src/app/api/*`, `src/voice/*` — TTS, Scribe captions, Gemini gist, audio cache |
| P3 UI/Design | `src/components/*`, `page.tsx`, themes, accessibility, Figma |
| P4 Integrations/Ship | Deploy, DeepSpace spike, n8n flow, README, Devpost, demo video |

Details and git rules: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Docs

- [docs/SPEC.md](docs/SPEC.md) — the full concept and technical spec
- [docs/ROADMAP.md](docs/ROADMAP.md) — phases, ownership, milestones
- [docs/RESEARCH.md](docs/RESEARCH.md) — what each person must verify
- [docs/GIST_PROMPT.md](docs/GIST_PROMPT.md) — the Gemini prompt
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — lanes, workflow, schedule

## Limits and honesty

- AirSign is **not** an interpreter and **not** ASL translation. It does not translate sign language. The starter gestures are arbitrary mappings, labeled as such in the UI.
- It is a helper for small moments where no interpreter is available. The honest next step is co-design with Deaf users.
- The AI never claims certainty. It shows candidates and confidence, and says "not sure" when confidence is low.
- Nothing is spoken until the user confirms it.
- We do not invent statistics or user quotes. The unsourced "99% of hearing people" claim must not be used.
- We do not claim more accessibility testing than we actually did.
