# AirSign: Master Bootstrap Prompt and Team Spec

> **Status:** pre-build concept and plan. Nothing here is implemented yet. Items marked VERIFY are unconfirmed — check the official docs before relying on them. This is a living document, not a contract.
>
> **Build docs:** [ARCHITECTURE.md](ARCHITECTURE.md) (base site + extension points) · [DESIGN.md](DESIGN.md) (3D/motion system) · [ROADMAP.md](ROADMAP.md) (tiers, slices, timeline) · [tasks/](tasks/) (per-person work).

Hackathon: HackCamp 2026 (nwPlus, UBC Vancouver), Nov 7–8, 2026. Team deadline: Nov 8, 12:00 PM PST.
Team: 4 people. Dev tools: opencode (coding agent) and docdex (local docs index for agents).

---

## 0. How to use this file

1. Everyone reads sections 1 to 4 (10 minutes). That is the whole idea, the rules, and the stack.
2. One person pastes this ENTIRE file into opencode as the first message. opencode executes section 7 (the bootstrap task) and makes the initial commit.
3. Save this file as `docs/SPEC.md` in the repo and run `docdexd index --repo .` so every agent sees the same context.
4. Each person then works in their own lane (section 8) and does their research items (section 9).

Items marked VERIFY are things I could not confirm. Check the official docs before relying on them.

---

## 1. Mission and honesty rules (read first)

AirSign is a communication helper for people who cannot easily speak or be understood in a quick moment: Deaf and hard-of-hearing signers, non-verbal people, people with speech difficulties, and people facing a language barrier. Example moment: a pharmacy counter with no interpreter available, where typing is slow.

The user makes a gesture, AirSign turns it into a phrase, the user confirms, and a natural voice (ElevenLabs) speaks it. The hearing person replies by voice and sees large high-contrast captions.

Non-negotiable rules:

- AirSign is NOT an interpreter and NOT ASL translation. Never write "ASL translator" or "translates sign language" in UI, README, Devpost, or the pitch.
- Allowed wording: "communication helper", "teach it your own gestures", "gist, not translation".
- The AI never claims certainty. It shows candidates and confidence. Low confidence shows "not sure".
- Nothing is spoken until the user confirms it.
- Video never leaves the browser. Only text goes to the server. Verify this in the network tab before claiming it.
- Do not invent statistics or user quotes. Cite real sources only. The "99% of hearing people" claim is unsourced and must not be used.
- Acknowledge criticism honestly: Deaf communities are often skeptical of sign-tech built without them. Position AirSign as a tool for small moments with no interpreter, and name next steps (co-design with Deaf users).
- The starter gestures (open palm, thumbs up, etc.) are arbitrary mappings, not ASL. Label them "Starter gestures" in the UI.

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
  - Best Use of DeepSpace: only if we genuinely integrate it (judged on product value, execution, meaningful use in real user flows).
  - Best use of n8n: only if n8n does a real job in a real user flow.
  - Best Project Built with Freebuff: optional, we must use it and explain how it helped.
  - nwChoice: automatic.
- ElevenLabs has no dedicated track on the Devpost page. Ask a mentor whether one was announced.
- Do NOT integrate Databricks as a telemetry dump. A bolted-on log counts as tacked-on.

---

## 3. Product spec

### Users and scenario
Primary story for the demo: pharmacy counter. Scenario packs: pharmacy, restaurant, transit, front desk, general.

### Phase 1: MVP (must work end to end first)
1. Camera view with a glowing hand-skeleton overlay on a canvas (mirrored).
2. Starter gestures from MediaPipe's built-in recognizer (Closed_Fist, Open_Palm, Pointing_Up, Thumb_Down, Thumb_Up, Victory, ILoveYou; ignore None), each mapped to an editable phrase.
3. Hold-to-lock with a circular progress ring. Default dwell 900 ms, adjustable 500 to 2000 ms (also an accessibility feature).
4. Sentence strip: locked phrases appear as chips that can be removed or reordered.
5. Confirm button, then ElevenLabs speaks the sentence. Three voice presets.
6. Reply mode: hearing person holds a button and speaks; large high-contrast live captions appear. Start with the browser Web Speech API.
7. Everything operable by buttons and keyboard (Space = confirm, C = clear, R = hold to reply).
8. Themes: dark neon, high-contrast yellow on black, light. Text size slider. Reduced-motion toggle.

### Phase 2: stand-out features
9. Teach-a-gesture: hold a pose, it records about 30 frames, the user names a phrase, stored in IndexedDB. Matching uses kNN with a rejection threshold.
10. Pre-rendered and cached audio for saved phrases (instant playback, saves credits).
11. Reply captions via ElevenLabs Scribe Realtime (fallback: Web Speech API).
12. Gemini "gist": joins candidates into one cautious sentence with an uncertainty flag. The user always confirms.

### Phase 3: stretch (pick at most one or two, only after Phase 2 is solid)
13. Gist mode for real signs: isolated signs, push-to-sign (hold Space), about 15 to 25 signs in one scenario pack. Hand landmarks plus pose landmarks (face and shoulder positions). Sequence matching with dynamic time warping (DTW) over about 32 frames. Show top 3 candidates with confidence. Go/no-go: at least about 85% accuracy on held-out tests with 3 different people, else label it experimental or cut it. Only use signs verified from reliable sources or a signer.
14. Two-phone conversation room (DeepSpace sync): hearing person scans a QR code, captions sync live.
15. n8n help alert: the phrase "I need help" triggers a webhook that notifies a saved contact (email or chat is easier than SMS for a demo, VERIFY node options).

### Out of scope
Continuous sign recognition, open-vocabulary ASL translation, accounts or login, server database, Databricks, claims of replacing interpreters.

---

## 4. Architecture and tech stack

Browser (private, on-device): camera, hand tracking, matcher, sentence strip, settings, IndexedDB storage.
Tiny server (Next.js route handlers, keys never in the client): `/api/speak`, `/api/gist`, `/api/scribe-token`, optional `/api/help-alert`.

### Libraries
- Framework: latest stable Next.js (App Router), React, TypeScript (strict).
- Styling: Tailwind CSS v4, shadcn/ui, lucide-react, next/font (Atkinson Hyperlegible for captions, a clean sans for UI).
- Vision: `@mediapipe/tasks-vision` (GestureRecognizer, VIDEO mode). Do NOT use the legacy `@mediapipe/hands` package; Google ended support for the legacy solutions in 2023.
- Voice: ElevenLabs. TTS model `eleven_flash_v2_5` (low latency). STT model `scribe_v2_realtime` via `@elevenlabs/react` (`useScribe` hook). Use plain `fetch` for TTS to keep dependencies small.
- LLM: Gemini via `@google/genai`. Model ID from env, default alias `gemini-flash-latest`. Check AI Studio for the free Flash model available on our key. VERIFY exact SDK parameter names for JSON/structured output.
- Storage: `idb-keyval` (IndexedDB) for custom gestures, audio cache, settings.
- Validation: `zod` for all API request and response bodies.
- Tests: `vitest` for pure logic (normalization, kNN, hold timer, schemas).
- Optional: `qrcode` or `qrcode.react` (only if building the two-phone room).

Pin exact versions after install and commit the lockfile.

### Vision details
- MediaPipe model file: download `gesture_recognizer.task` (URL in the MediaPipe Gesture Recognizer web docs: `https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task`) into `public/models/`.
- Copy the wasm folder from `node_modules/@mediapipe/tasks-vision/wasm` into `public/mediapipe/wasm`. Self-host both so venue Wi-Fi cannot break the demo.
- Recognition calls block the main thread, so run inference in a Web Worker. RISK: MediaPipe in a Next.js worker can be fiddly. If worker setup takes more than 45 minutes, run on the main thread, detect every second frame, and optimize later. Ship first.
- Camera and mic require HTTPS or localhost.
- Landmark normalization for custom gestures: translate to wrist origin, scale by the wrist to middle-finger-MCP distance, mirror left hands, flatten 21 x 3 into 63 floats.
- kNN: k = 5, reject as "unknown" if the mean neighbour distance exceeds a calibrated threshold.
- Hold-to-lock: majority vote over the last 8 frames, confidence at least 0.6 for built-in gestures, a 600 ms cooldown after each lock to avoid repeats. Ignore None.

### Voice details
- TTS: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`, header `xi-api-key`, JSON body `{ text, model_id: "eleven_flash_v2_5" }`, response is `audio/mpeg`. Max 500 characters per request in our API.
- Voice IDs: do not guess. Each person picks 3 voices in the ElevenLabs dashboard; IDs go in env vars.
- Audio cache: IndexedDB, key = SHA-256 of `text|voiceKey` (Web Crypto). Pre-render saved phrases when they are saved.
- Scribe Realtime token: the server must hand the browser a short-lived token so the API key is never exposed. VERIFY the exact token endpoint in the ElevenLabs docs.
- Fallbacks: `window.speechSynthesis` if ElevenLabs fails; Web Speech API for captions if Scribe fails. Note the Web Speech API is Chrome-centric.

### Gist (Gemini) details
- `/api/gist` receives `{ scenario, candidates }`, calls Gemini with the system prompt in section 10 and a JSON schema response, validates with zod, and returns `{ gist, uncertain, note }`.
- If Gemini fails or times out (5 s), return the raw candidate labels joined with spaces and `uncertain: true`.

### Environment variables (`.env.local`, never committed)
See `.env.example` in section 5.

### Deploy
Render Web Service (Node): build `npm ci && npm run build`, start `npm start`, set env vars in the dashboard. Vercel is an acceptable alternative (no listed prize for either). Deploy a hello page in the first hour, because camera and mic only work over HTTPS. A custom domain is optional and gives no listed prize; the GoDaddy Registry domain prize needs an eligible domain (VERIFY before spending time).

---

## 5. Files with exact content (opencode: create these verbatim)

### `.env.example`
```
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_WARM=
ELEVENLABS_VOICE_CALM=
ELEVENLABS_VOICE_ENERGETIC=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
N8N_HELP_WEBHOOK_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `src/lib/contracts.ts`
```ts
export type ScenarioId = 'pharmacy' | 'restaurant' | 'transit' | 'frontdesk' | 'general';
export type VoiceKey = 'warm' | 'calm' | 'energetic';
export type ThemeId = 'dark-neon' | 'high-contrast' | 'light';
export type GestureSource = 'builtin' | 'custom' | 'sequence';

export type Candidate = { label: string; confidence: number };

export type Phrase = {
  id: string;
  label: string;
  text: string;
  scenario?: ScenarioId;
};

export type GestureEvent = {
  phraseId: string | null;
  label: string;
  confidence: number;
  alternatives: Candidate[];
  source: GestureSource;
  at: number;
};

export type SpeakRequest = { text: string; voice: VoiceKey };

export type GistRequest = { scenario: ScenarioId; candidates: Candidate[][] };
export type GistResponse = { gist: string; uncertain: boolean; note: string };

export type Settings = {
  theme: ThemeId;
  textScale: number;
  dwellMs: number;
  reducedMotion: boolean;
  voice: VoiceKey;
  scenario: ScenarioId;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark-neon',
  textScale: 1,
  dwellMs: 900,
  reducedMotion: false,
  voice: 'warm',
  scenario: 'pharmacy',
};
```

### `src/lib/schemas.ts`
zod schemas mirroring `SpeakRequest`, `GistRequest`, `GistResponse` (text 1 to 500 chars; candidate confidence 0 to 1; at most 8 phrases of at most 6 candidates each).

### `src/lib/starter-phrases.ts`
```ts
export const STARTER_PHRASES: Record<string, string> = {
  Open_Palm: 'Hello.',
  Thumb_Up: 'Yes.',
  Thumb_Down: 'No.',
  Closed_Fist: 'Please wait.',
  Pointing_Up: 'I have a question.',
  Victory: 'Thank you.',
  ILoveYou: 'I need help.',
};
```

---

## 6. Repo structure

```
airsign/
  docs/
    SPEC.md              (this file)
    GIST_PROMPT.md       (section 10)
    RESEARCH.md          (section 9 checklist with notes)
    CONTRIBUTING.md      (section 8 workflow)
  public/
    models/              (gesture_recognizer.task, downloaded by script)
    mediapipe/wasm/      (copied by script)
  scripts/
    setup-assets.mjs     (copies wasm, downloads the model, idempotent)
  src/
    app/
      layout.tsx  page.tsx  globals.css
      api/
        speak/route.ts
        gist/route.ts
        scribe-token/route.ts
        help-alert/route.ts      (stub returning 501 until n8n is wired)
    engine/                      (P1)
      camera.ts  recognizer.worker.ts  normalize.ts  knn.ts  hold.ts  useGestures.ts
    voice/                       (P2)
      useSpeak.ts  useCaptions.ts  audio-cache.ts
    components/                  (P3)
      CameraPanel.tsx  HoldRing.tsx  SentenceStrip.tsx  GistCard.tsx
      Captions.tsx  SettingsBar.tsx  ScenarioPicker.tsx  Waveform.tsx
    lib/
      contracts.ts  schemas.ts  starter-phrases.ts  storage.ts
  .env.example  .gitignore  package.json  tsconfig.json  README.md
```

---

## 7. TASK FOR OPENCODE: bootstrap and initial commit

Do the following in order. Stop and report if a step fails. Never print or commit secrets.

1. Scaffold: run `npx create-next-app@latest airsign` non-interactively with TypeScript, Tailwind, ESLint, App Router, `src/` directory, import alias `@/*`, npm. Adjust flags to the installed version. Work inside the created folder.
2. Install runtime deps: `@mediapipe/tasks-vision @elevenlabs/react @google/genai idb-keyval zod lucide-react`.
3. Install dev deps: `vitest @vitest/coverage-v8 prettier`.
4. Initialize shadcn/ui (`npx shadcn@latest init`) and add: button, card, slider, switch, select, badge, progress, tooltip, sonner.
5. Create every file and folder in section 6. Use the exact content in section 5 for `.env.example`, `contracts.ts`, `starter-phrases.ts`. Write `schemas.ts` as described.
6. Implement real, compiling versions (no TODO comments, no lorem ipsum) of:
   - `normalize.ts` (landmark normalization per section 4) and `knn.ts` (k = 5, rejection threshold) with vitest tests.
   - `hold.ts` (majority vote over 8 frames, dwell timer, cooldown) with vitest tests.
   - `/api/speak` (validate with zod, call ElevenLabs TTS with `eleven_flash_v2_5`, return `audio/mpeg`, clear JSON errors, input cap 500 chars).
   - `/api/gist` (validate, call Gemini with the prompt in `docs/GIST_PROMPT.md`, JSON output, 5 s timeout, fallback described in section 4).
   - `/api/scribe-token`: implement per current ElevenLabs docs; if the correct endpoint cannot be confirmed, return 501 with a clear message and document it in `docs/RESEARCH.md`.
   - `/api/help-alert`: return 501 until wired.
   - `audio-cache.ts` and `storage.ts` using `idb-keyval`.
7. Create a minimal `page.tsx` shell (split layout: camera panel on the left, sentence strip, gist card, captions on the right, settings bar on top) with placeholder-free, accessible markup. UI strings must follow the honesty rules in section 1.
8. Write `scripts/setup-assets.mjs` (copy wasm from `node_modules/@mediapipe/tasks-vision/wasm` to `public/mediapipe/wasm`; download the gesture model to `public/models/gesture_recognizer.task` if missing; print clear messages). Add npm scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `setup:assets`.
9. Write `.gitignore` additions: `.env*` (keep `.env.example`), `.docdex/`, `public/models/*.task`, `public/mediapipe/`, `node_modules`, `.next`.
10. Write `README.md`: what AirSign is (using the honest wording), quick start (`npm i`, copy `.env.example` to `.env.local`, `npm run setup:assets`, `npm run dev`), env vars, scripts, folder map, team lanes, and a short "limits and honesty" section.
11. Write `docs/CONTRIBUTING.md` from section 8 and `docs/RESEARCH.md` from section 9. Save this whole file as `docs/SPEC.md`. Write `docs/GIST_PROMPT.md` from section 10.
12. Verify: run `npm run typecheck && npm run lint && npm run test && npm run build`. Fix everything until all pass.
13. Git: `git init` (if needed), `git add -A`, confirm no `.env.local` or keys are staged, then commit on `main` with the message `chore: scaffold AirSign (Next.js, contracts, API routes, docs)`.
14. Create local branches from that commit: `p1/engine`, `p2/voice-api`, `p3/ui`, `p4/integrations`. Do not push. Print the exact commands the human should run to add the remote and push all branches.
15. Final report: list created files, test results, anything that is a stub (501 routes), and any VERIFY item you could not resolve.

---

## 8. Team lanes and workflow

Lanes:
- P1 Engine: `src/engine/*`. Camera, worker, skeleton overlay, hold ring logic, teach-a-gesture, then Phase 3 sign matcher.
- P2 Voice/API: `src/app/api/*`, `src/voice/*`. TTS, Scribe captions, Gemini gist, audio cache, fallbacks.
- P3 UI/Design: `src/components/*`, `page.tsx`, themes, accessibility, Figma frames.
- P4 Integrations/Ship: DeepSpace spike, n8n flow, deploy, README, Devpost text, demo video.

Git rules:
- Trunk-based. Short-lived branches per person (`p1/...`). Merge to `main` often (at least every 1 to 2 hours) after `npm run typecheck && npm run build` passes.
- `main` must always build and deploy. Never force-push `main`. Rebase on `main` before merging.
- Commit style: `feat(engine): ...`, `fix(ui): ...`, `chore: ...`.
- Shared types change only in `src/lib/contracts.ts`, announced to the team first.
- Secrets live only in `.env.local` and the deploy dashboard.

Schedule (counted from your start; adjust once you know the hours left):
- 0 to 0.5h: bootstrap commit, everyone clones, env keys, pick the demo scenario.
- 0.5 to 1.5h spikes: P1 camera plus landmarks on screen; P2 `/api/speak` plays "hello" in the browser; P3 Figma frames and shell; P4 DeepSpace spike plus deploy hello page.
- 1.5h gate: if a spike fails, drop that item (DeepSpace first) and continue.
- By ~6h: Phase 1 works end to end.
- By ~10h: Phase 2.
- Sleep. Tired demos fail.
- Morning: at most one Phase 3 item.
- T-3h: FEATURE FREEZE.
- T-3h to T-1h: test on two devices, record backup demo video, finish Devpost, README, Figma link.
- T-1h: submit.

Cut order if behind: two-phone room, then n8n, then Phase 3 sign matcher, then Scribe (keep Web Speech fallback). Never cut: confirm-before-speak, button fallbacks, themes, the backup video.

---

## 9. Research checklist (each person verifies and records answers in `docs/RESEARCH.md`)

- R1 (P2) ElevenLabs: browser-safe token flow for Scribe Realtime; `eleven_flash_v2_5` request options; free-tier credit limits; pick 3 voice IDs; confirm `useScribe` setup in `@elevenlabs/react`.
- R2 (P1) MediaPipe: GestureRecognizer in a worker inside Next.js versus main thread; GPU delegate; frame rate on the demo laptop; lighting tests in the actual venue.
- R3 (P2) Gemini: exact current free Flash model ID in AI Studio; structured JSON output parameters in `@google/genai`; rate limits.
- R4 (P4) DeepSpace (docs.deep.space): can it hold server-side secrets or run a route calling ElevenLabs? Realtime records? Deploy URL? Decide go/no-go with evidence.
- R5 (P4) n8n Cloud: webhook trigger plus email or chat node; how to demo reliably without SMS setup.
- R6 (P3) Accessibility: axe or Lighthouse checks, ARIA live region behaviour for captions, contrast checks for all three themes, Atkinson Hyperlegible via `next/font/google`.
- R7 (P4) Deploy: Render versus Vercel, HTTPS camera and mic test on two devices, env var setup.
- R8 (all) Browser support: test Web Speech API fallback and camera permissions on Chrome and one other browser.
- R9 (Phase 3 only) Sign vocabulary: confirm each sign from reliable sources or a signer; check any public dataset license before using it. Do not demo signs we cannot verify.

---

## 10. Gist prompt (`docs/GIST_PROMPT.md`, the actual product prompt for Gemini)

```
You help a person communicate. You receive a scenario and a list of recognizer candidates for each sign or gesture, each with a confidence from 0 to 1.
Write ONE short, polite, first-person sentence the person most likely means.
Rules: use only the candidates; never add facts, names, numbers or medical details. If any needed candidate has confidence below 0.6, or candidates conflict, set uncertain=true and list the alternatives in note. Output JSON only: {"gist": string, "uncertain": boolean, "note": string}.
```

The UI always labels the result "AI guess, please confirm" and shows the raw candidates beside it.

---

## 11. Accessibility requirements (also our pitch)

- Fully usable without gestures: every action has a button and a keyboard shortcut.
- Captions panel uses `aria-live="polite"`, large type, high contrast.
- Text contrast at least 4.5:1 in all three themes. Glow effects only on non-text elements.
- Respect `prefers-reduced-motion` and offer a manual toggle.
- Adjustable dwell time and text size. Visible focus states. No information conveyed by colour alone.
- Run axe or Lighthouse and fix issues before submitting. Describe what we did in the Devpost accessibility paragraph. Do not claim more than we tested.

---

## 12. Demo, pitch, and submission

Visual direction: near-black background, cyan or teal skeleton glow, amber reserved for "AI guess / uncertain", giant captions, animated waveform while speaking, hold ring that fills smoothly. Polish empty, loading and error states.

3-minute demo script:
1. Problem in one concrete scenario (20s).
2. Starter gestures to a spoken sentence, live (30s).
3. Teach a new gesture on the spot (30s).
4. Hearing person replies by voice, captions appear (20s).
5. Gist mode with visible uncertainty, only if built (30s).
6. Themes, keyboard use, "video never leaves your device" (20s).
7. Impact, honest limits, next step: co-design with Deaf users (30s).

Record a backup video of everything before the freeze.

Submission checklist:
- GitHub repo link, Figma link, video of 4 minutes or less.
- Problem statement and solution description, impact statement, accessibility considerations paragraph, honest limitations.
- One short paragraph per prize opted into: how we used ElevenLabs, Gemini, and (only if real) DeepSpace and n8n.
- Opt in on each prize on Devpost and meet each prize's extra requirement.

---

## 13. Top risks

- Camera or lighting fails at the venue: test early, keep the backup video, keep button fallbacks.
- Wrong gestures fire: threshold plus majority vote plus cooldown; show confidence.
- API or Wi-Fi limits: cached audio, browser speech fallback, self-hosted MediaPipe files.
- Mic permissions block reply mode: test on the demo device; keep a typed reply option.
- Overbuilding: only Phase 1 is required. Everything else is a bonus.
- Overclaiming: a wrong or overhyped claim in front of a judge who knows sign language costs more than any missing feature.
