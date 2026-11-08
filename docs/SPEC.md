# AirSign: Master Bootstrap Prompt and Team Spec

> **Status:** product direction updated Nov 7, 2026. The base site is built. This spec now describes the **conversation-window** product: a hearing person points a device at someone signing, AirSign frames the gist, the signer confirms, and a voice speaks it. It is still **not** an interpreter and **not** ASL translation.
>
> **Build docs:** [RESOURCES.md](RESOURCES.md) (accounts, APIs, model IDs) · [ARCHITECTURE.md](ARCHITECTURE.md) · [DESIGN.md](DESIGN.md) · [ROADMAP.md](ROADMAP.md) · [tasks/](tasks/)

Hackathon: HackCamp 2026 (nwPlus, UBC Vancouver), Nov 7–8, 2026. Team deadline: Nov 8, 12:00 PM PST.
Team: 4 people. Dev tools: opencode and docdex.

---

## 0. How to use this file

1. Everyone reads sections 1 to 4 (10 minutes). That is the idea, the rules, and the stack.
2. Read [RESOURCES.md](RESOURCES.md) before touching Gemini, MediaPipe, or ElevenLabs.
3. Each person works in their own lane (section 8) and records research in `docs/RESEARCH.md`.
4. Items marked VERIFY are unconfirmed. Check the official docs and record the answer.

---

## 1. Mission and honesty rules (read first)

AirSign is a **conversation window** for people who cannot speak or cannot easily be understood in a quick moment: Deaf and hard-of-hearing signers, non-verbal people, people with speech difficulties, and people facing a language barrier.

The scene we design for: a pharmacy counter with no interpreter. The hearing person holds a laptop or phone. The camera faces the person signing. The signer makes a short burst of signs. AirSign reads the hand movement, uses Gemini to frame **the gist** in one plain sentence, shows it for confirmation, and speaks it out loud. The hearing person replies by voice, and their words appear as large live captions on the same transcript.

The feeling is an interpreter sitting between two people. The claim is not.

Non-negotiable rules:

- AirSign is **NOT an interpreter** and **NOT ASL translation**. Never write "ASL translator", "translates sign language", or "understands sign language" in UI, README, Devpost, or the pitch.
- Allowed wording: "communication window", "gist, not translation", "frames the gist", "confirm before speaking".
- The AI never claims certainty. It shows a confidence value and an explicit "AI gist — please confirm" label. Low confidence shows "Not sure".
- Nothing is spoken until the signer confirms it.
- Video never leaves the browser. Only normalized landmark numbers and text go to the server. A single still frame is opt-in, off by default, and not part of the MVP.
- Do not invent statistics or user quotes. Cite real sources only.
- Acknowledge criticism honestly: Deaf communities are often skeptical of sign-tech built without them. Position AirSign as a tool for small moments with no interpreter, and name the next step (co-design with Deaf users).
- Do not demo signs we cannot verify with a signer or a reliable source.

Judging reality: Problem and User Research is a scoring criterion. Honest framing scores better than overclaiming.

---

## 2. Event facts (verified from Devpost on Nov 7; re-check for changes)

- 24-hour, beginner-friendly hackathon by nwPlus. Challenge: identify a problem facing a community and build a solution that makes a meaningful difference. Focus: accessibility, inclusivity, diversity.
- Judging criteria: Problem & User Research, Innovation, Technical Implementation, Design & User Experience, Presentation.
- Submission needs: GitHub repo link, Figma link (if applicable), optional demo video (max 4 min, highly recommended).
- Teams: 1 to 4 people, one submission per team, one major prize per team.
- Beginner prizes need at least 66% of the team to be beginners. "Most Accessible Design" is beginner-only. Eligibility for our team: UNKNOWN, confirm.
- Prizes we target (each needs an opt-in on Devpost plus a short written explanation):
  - Overall Winner: automatic. Package includes ElevenLabs subscriptions and automatic nwHacks admission.
  - Best Design (open to all): opt in and submit a Figma link.
  - Community Impact (open to all): opt in and include a brief impact statement.
  - Best Use of Gemini API (MLH): opt in and incorporate the Gemini API.
  - Best Use of DeepSpace: only if we genuinely integrate it.
  - Best use of n8n: only if n8n does a real job in a real user flow.
  - Best Project Built with Freebuff: optional, we must use it and explain how it helped.
  - nwChoice: automatic.
- ElevenLabs has no dedicated track on the Devpost page. Ask a mentor whether one was announced.
- Do NOT integrate Databricks as a telemetry dump.

---

## 3. Product spec

### 3.1 Users and the two roles

- **Signer** — the person who cannot speak easily. Signs at the camera.
- **Listener** — the hearing person. Holds the device, reads the gist, hears the voice, and replies.

One device. The camera faces the signer. The screen and speaker face the listener. Both see the same transcript.

### 3.2 The core loop (MVP, must work end to end)

1. **Camera on.** A live view of the signer with a glowing hand-landmark overlay. Status: "Watching your hands."
2. **Capture a short burst.** The listener taps **Capture** (or presses Space). AirSign records ~2–4 seconds of landmarks. A progress ring shows the capture.
3. **Frame the gist.** MediaPipe produces coarse candidates. `POST /api/gist` sends context + candidates + a compact landmark summary to Gemini. Gemini returns one short first-person sentence, a confidence value, alternatives, and an uncertainty flag.
4. **Show it, never speak it yet.** The sentence appears in large type with **"AI gist — please confirm"**. Low confidence shows **"Not sure"** and the alternatives.
5. **Confirm → speak.** The signer or listener presses **Speak**. ElevenLabs (or the browser fallback) speaks the sentence. It is added to the transcript as a signer turn.
6. **Reply → captions.** The listener presses **Listen** and speaks. Their words appear as large live captions and are added as a listener turn.
7. **Every step has a button and a keyboard path.** Camera failure falls back to typing.

### 3.3 What is deliberately out of scope

- Continuous, open-vocabulary sign recognition.
- Word-for-word ASL translation.
- Accounts, a server database, or a cloud transcript.
- Streaming video to any model.
- Claims of replacing a human interpreter.

### 3.4 Context packs

The old scenario carousel is gone. A small **context** selector remains inside `/app` and settings. It only tunes the Gemini prompt: pharmacy, restaurant, transit, front desk, general. It is a hint, not a vocabulary.

### 3.5 States the UI must handle

`idle`, `watching`, `capturing`, `thinking`, `ready` (gist waiting), `listening`, `speaking`, `unsure`, `denied`, `error`, `unsupported captions`.

---

## 4. Architecture and tech stack

Browser (private, on-device): camera, hand landmarks, normalization, capture buffer, transcript, settings.

Tiny server (Next.js route handlers, keys never in the client): `/api/gist`, `/api/speak`, optional `/api/scribe-token`.

### Libraries

- Framework: Next.js 16 App Router, React 19, TypeScript strict.
- Styling: Tailwind CSS v4, shadcn/ui, lucide-react, next/font.
- Vision: `@mediapipe/tasks-vision` (HandLandmarker, and optionally GestureRecognizer). Self-host wasm and model.
- Voice: ElevenLabs `eleven_flash_v2_5` for TTS; Web Speech API for reply captions; Scribe only as a fallback.
- LLM: Gemini via `@google/genai`. Default `gemini-3.8-flash`. Model ID from env.
- Storage: `idb-keyval`.
- Validation: `zod`.
- Tests: `vitest`.
- 3D/motion (landing only): `motion`, Three.js, R3F, Drei.

### Gist (Gemini) details

- `/api/gist` receives `{ context, capture }` where `capture` has `frames`, `durationMs`, `candidates`, and an optional compact `summary`.
- Calls Gemini with the prompt in `GIST_PROMPT.md` and a JSON schema.
- Validates with zod.
- 5 s timeout. On failure, join the candidate labels and return `uncertain: true`.
- Returns `{ gist, uncertain, confidence, alternatives, note }`.
- Never adds facts, names, numbers, or medical details.

### Voice details

- TTS: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`, `model_id: "eleven_flash_v2_5"`, `audio/mpeg`, 500-char cap.
- Voice IDs come from env. Never accept a raw ID from the client.
- Audio cache: IndexedDB, key = SHA-256 of `text|voiceKey`.
- Fallback: `window.speechSynthesis`.
- Captions: Web Speech API first. Show `supported`. Typed reply always works.

### Environment variables

See [RESOURCES.md](RESOURCES.md) section 6 and `.env.example`.

### Deploy

Render Web Service (Node) or Vercel. HTTPS is required for camera and mic. Deploy a hello page in the first hour.

---

## 5. Contracts (source of truth: `src/lib/contracts.ts`)

```ts
export type ContextId = 'pharmacy' | 'restaurant' | 'transit' | 'frontdesk' | 'general';
export type VoiceKey = 'warm' | 'calm' | 'energetic';
export type ThemeId = 'dark-neon' | 'high-contrast' | 'light';

export type Candidate = { label: string; confidence: number };

export type SignCapture = {
  context: ContextId;
  frames: number;
  durationMs: number;
  candidates: Candidate[];
  summary?: number[];
};

export type GistResponse = {
  gist: string;
  uncertain: boolean;
  confidence: number;
  alternatives: string[];
  note: string;
};

export type ConversationTurn = {
  id: string;
  role: 'signer' | 'listener';
  text: string;
  source: 'ai' | 'speech' | 'typed';
  uncertain?: boolean;
  confidence?: number;
  at: number;
};
```

The old `Phrase`, `Sentence`, `GestureEvent`, and starter-gesture contracts are removed.

---

## 6. Repo structure

```
airsign/
  docs/            SPEC, RESOURCES, ARCHITECTURE, DESIGN, ROADMAP, RESEARCH, GIST_PROMPT, tasks/
  public/          models/, mediapipe/wasm/
  scripts/         setup-assets.mjs
  src/
    app/
      page.tsx                 landing
      app/page.tsx             conversation workspace
      api/gist/route.ts        Gemini
      api/speak/route.ts       ElevenLabs
      api/scribe-token/route.ts
    components/
      landing/                 hero, conversation preview, pipeline demo, sections
      app/                     conversation stage, transcript, gist confirm, reply bar
      mocks/                   SignCamera, useSpeak, useCaptions
      motion/                  Reveal, TiltCard, Parallax, Magnetic
      ui/                      shadcn primitives
    engine/                    P1: camera, landmarks, normalize, capture
    voice/                     P2: speak, captions, cache
    lib/                       contracts, contexts, ports, gist, storage, flags
```

---

## 7. Task for the bootstrap agent (already completed)

The scaffold, dependencies, design system, contracts, mocks, landing, and `/app` shell are built. What remains is the real engine, API, and voice work described in `docs/tasks/`.

---

## 8. Team lanes and workflow

- **P1 Engine:** `src/engine/*`, `src/components/mocks/sign-camera.tsx` → real. Camera, HandLandmarker, landmark overlay, capture buffer, normalization.
- **P2 Voice/API:** `src/app/api/*`, `src/voice/*`. Gemini gist, ElevenLabs TTS, captions, cache, fallbacks.
- **P3 UI/Design:** `src/app/page.tsx`, `layout.tsx`, `globals.css`, `src/components/*`, ports, storage. Conversation UI, transcript, settings, landing, accessibility.
- **P4 Integrations/Ship:** docs, deploy, research, demo video, Devpost.

Git rules:

- Trunk-based. Short-lived branches per person (`p1/...`). Merge often after `npm run typecheck && npm run build`.
- `main` always builds and deploys. Never force-push `main`.
- Commit style: `feat(engine): ...`, `fix(ui): ...`, `chore: ...`.
- Shared types change only in `src/lib/contracts.ts`, announced first.
- Secrets live only in `.env.local` and the deploy dashboard.

Schedule:

- 0–0.5h: clone, keys, pick the demo context.
- 0.5–1.5h spikes: P1 landmarks on screen; P2 `/api/gist` returns a sentence; P3 shell; P4 deploy hello page.
- 1.5h gate: if a spike fails, drop it and continue.
- By ~6h: the conversation loop works end to end with mocks or real pieces.
- By ~10h: real camera + Gemini + voice.
- Sleep. Tired demos fail.
- Morning: at most one stretch item.
- T-3h: FEATURE FREEZE.
- T-3h to T-1h: two-device test, backup video, Devpost, README, Figma link.
- T-1h: submit.

Cut order if behind: Scribe → two-phone room → n8n → still-frame sharing. Never cut: confirm-before-speak, typed fallback, themes, the backup video.

---

## 9. Research checklist

See [RESEARCH.md](RESEARCH.md). Every VERIFY item belongs there until confirmed.

---

## 10. Gist prompt

See [GIST_PROMPT.md](GIST_PROMPT.md). It is the actual product prompt for Gemini and must stay cautious.

---

## 11. Accessibility requirements (also our pitch)

- Fully usable without gestures: every action has a button and a keyboard shortcut.
- The transcript and reply captions use `aria-live="polite"`, large type, high contrast.
- Text contrast at least 4.5:1 in all three themes. Glow only on non-text elements.
- Respect `prefers-reduced-motion` and offer a manual toggle.
- Adjustable text size and capture length. Visible focus states. No information by colour alone.
- Run axe or Lighthouse and fix issues before submitting. Describe what we did. Do not claim more than we tested.

---

## 12. Demo, pitch, and submission

Visual direction: near-black background, cyan landmark glow, amber for "AI gist / uncertain", giant gist text, waveform while speaking, a transcript that reads like a conversation.

3-minute demo script:

1. Problem in one concrete scene: a counter, no interpreter, typing is too slow (20 s).
2. Live: point the camera, capture a short sign burst, gist appears with "AI gist — please confirm" (40 s).
3. Confirm → the voice speaks it (20 s).
4. The hearing person replies; large captions appear on the same transcript (25 s).
5. Low-confidence state: "Not sure" plus alternatives (20 s).
6. Themes, keyboard-only operation, video stays on-device (25 s).
7. Impact, honest limits, next step: co-design with Deaf users (30 s).

Record a backup video of everything before the freeze.

Submission checklist:

- GitHub repo link, Figma link, video of 4 minutes or less.
- Problem statement, solution, impact, accessibility paragraph, honest limitations.
- One short paragraph per prize opted into.
- Opt in on each prize and meet its extra requirement.

---

## 13. Top risks

- Camera or lighting fails at the venue: test early, keep the backup video, keep the typed fallback.
- Gemini rate-limits or times out: 5 s fallback, model ID in env, cache nothing sensitive.
- MediaPipe in a worker is fiddly: main thread first, every second frame, 45-minute cap.
- Wrong gist: always show confidence, alternatives, and the confirm gate.
- Mic permissions block reply mode: typed reply always works.
- Overbuilding: the conversation loop is the only required scope.
- Overclaiming: a wrong claim in front of a judge who signs costs more than any missing feature.
