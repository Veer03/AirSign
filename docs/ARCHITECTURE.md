# Architecture

How AirSign is put together, and how to build on it without rewrites.

The base site is **built**: a landing page and a fully interactive conversation workspace running on typed mocks. This doc describes the real modules that plug in next.

Related: [RESOURCES.md](RESOURCES.md) · [DESIGN.md](DESIGN.md) · [ROADMAP.md](ROADMAP.md) · [tasks/](tasks/)

## 1. What the base site is

- Two routes: `/` (landing) and `/app` (conversation workspace).
- One design system: tokens, three themes, typography, motion primitives.
- Shared contracts and typed interfaces between lanes.
- `ports.ts` + mocks so UI work never blocks on engine or API work.
- Server routes with keys kept server-side.
- A deploy target that works over HTTPS.

It is **not** a marketing template. The landing tells the story; the app is the product.

## 2. Goals and non-goals

**Goals**

- Something demoable lands every 1–2 hours.
- P1, P2, and P3 work in parallel from hour one.
- Features are added by composition, not by editing a monolith.
- The app stays fast, accessible, and calm.
- The landing carries the premium 3D motion without risking the demo.

**Non-goals**

- A CMS, accounts, a database, or multi-tenant infrastructure.
- Continuous sign recognition or open-vocabulary translation.
- Streaming video to any model.
- 3D on every screen.

## 3. Routes

| Route | Purpose | Owner |
|---|---|---|
| `/` | Landing: problem, the loop, live pipeline demo, features, privacy, honesty, CTA | P3 |
| `/app` | Conversation workspace: signer camera, capture, gist, confirm, transcript, reply | P3 shell, P1/P2 features |
| `/api/gist` | Capture + context → cautious sentence + uncertainty | P2 |
| `/api/speak` | Text → ElevenLabs audio (`audio/mpeg`) | P2 |
| `/api/scribe-token` | Short-lived Scribe token, or 501 until verified | P2 |
| `/api/help-alert` | n8n webhook, or 501 until wired | P4 |

## 4. Stack (confirmed Nov 7, 2026)

| Package | Version | Notes |
|---|---|---|
| `next` | 16.4.5 | App Router, route handlers |
| `react` / `react-dom` | 19.3.1 | |
| `typescript` | 5.9.3 | strict |
| `tailwindcss` | 4.3.5 | CSS-first config |
| `shadcn/ui` | CLI | Radix primitives |
| `lucide-react` | 1.70.0 | icons |
| `motion` | 14.10.1 | import from `motion/react` |
| `gsap` | 3.15.1 | free for all users |
| `three` | 0.187.0 | |
| `@react-three/fiber` | 9.8.2 | React 19 compatible |
| `@react-three/drei` | 10.7.9 | |
| `@mediapipe/tasks-vision` | 1.2.2 | HandLandmarker / GestureRecognizer |
| `@elevenlabs/react` | 1.21.1 | Scribe hook |
| `@google/genai` | 3.0.0 | Gemini |
| `idb-keyval` | 6.3.0 | IndexedDB |
| `zod` | 4.6.7 | validation |
| `vitest` | 5.1.0 | pure-logic tests |

Pin exact versions after install and commit the lockfile.

## 5. Folder structure

```
src/
  app/
    layout.tsx                 # fonts, theme provider, metadata
    page.tsx                   # landing
    app/page.tsx               # conversation workspace
    globals.css                # tokens, themes, base styles
    api/
      gist/route.ts
      speak/route.ts
      scribe-token/route.ts
      help-alert/route.ts
  components/
    ui/                        # shadcn primitives
    landing/                   # hero, conversation preview, pipeline demo, sections
    motion/                    # Reveal, TiltCard, Parallax, Magnetic
    mocks/                     # SignCamera, useSpeak, useCaptions
    app/                       # conversation stage, transcript, gist confirm, reply bar
  engine/                      # P1
    camera.ts
    hand-landmarker.ts
    recognizer.worker.ts       # optional; main-thread fallback first
    normalize.ts
    capture.ts
    useSignCapture.ts
  voice/                       # P2
    useSpeak.ts
    useCaptions.ts
    audio-cache.ts
  lib/
    contracts.ts               # shared types; announce changes
    contexts.ts                # prompt hints, not a vocabulary
    mock-signs.ts              # deterministic demo candidates + gists
    gist.ts                    # mock/fallback gist builder
    gist-client.ts             # calls /api/gist, falls back locally
    ports.ts                   # real ↔ mock switch
    storage.ts                 # idb-keyval wrappers
    flags.ts                   # feature flags
    utils.ts                   # cn()
  tests/
```

## 6. Data flow

```
Camera (browser)
  → MediaPipe GestureRecognizer (on-device; hand landmarks + general handshape classes)
  → normalize landmarks (wrist origin, scale, mirror)
  → capture buffer (~2–4 s) + landmark summary
  → ASL vocabulary classifier (next; temporal, signer-tested model)
  → coarse ASL word candidates
  → SignCapture
  → POST /api/gist (context + candidates + compact summary)
  → Gemini → { gist, uncertain, confidence, alternatives, note }
  → "AI gist — please confirm"
  → confirm
  → POST /api/speak (text + voice)
  → ElevenLabs TTS → audio/mpeg → play (or cached in IndexedDB)

Hearing person speaks
  → Web Speech API (browser) or Scribe
  → large captions → listener turn in the transcript
```

**Pixels never leave the browser.** Only landmark numbers and text are sent. A single still frame is opt-in, off by default, and not part of the MVP.

## 7. Contracts and ports

`src/lib/contracts.ts` is the shared language. Any change is announced before merging.

`src/lib/ports.ts` is the swap point. Current state:

```ts
// Current
export { SignCamera } from '@/components/engine/sign-camera';
export { useSpeak } from '@/components/mocks/use-speak';
export { useCaptions } from '@/components/mocks/use-captions';
```

The live camera uses MediaPipe locally and currently classifies its built-in general handshape set. It does not produce ASL word candidates yet. Speech and captions remain typed mocks.

## 8. State management

- Local component state for ephemeral UI.
- One `SettingsProvider` (React context + `useReducer`) for theme, text scale, capture length, reduced motion, voice, context.
- The conversation state machine lives in `useConversation` (or inside `workspace.tsx`): `idle → capturing → thinking → ready → speaking`, plus `unsure`, `denied`, `error`.
- Persist settings with `idb-keyval` via `storage.ts`.
- No Redux, no Zustand unless a real need appears.

## 9. API routes

Every route:

1. Parses with a zod schema.
2. Returns `ApiError` JSON on failure: `{ error: { code, message } }`.
3. Keeps keys server-side.
4. Has a timeout and a clear fallback.
5. Caps input (speak: 500 chars; gist: 1 capture, at most 8 candidates, summary at most 256 numbers).

`/api/speak` returns `audio/mpeg`. `/api/gist` returns `GistResponse`. `/api/scribe-token` and `/api/help-alert` return 501 with a clear message until verified or wired.

## 10. Storage

| Key | Contents |
|---|---|
| `airsign:settings` | `Settings` |
| `airsign:audio:<sha256>` | cached MP3 blobs |
| `airsign:transcript` | optional local transcript, cleared on demand |

All storage is local to the browser. No server database.

## 11. Feature flags

`src/lib/flags.ts`, driven by `NEXT_PUBLIC_*` env vars with safe defaults:

| Flag | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCKS` | `1` | Use curated demo gist responses for typed demo captures |
| `NEXT_PUBLIC_ENABLE_LANDING_3D` | `1` | Toggle heavy landing motion |
| `NEXT_PUBLIC_ENABLE_GIST` | `1` | Gemini gist |
| `NEXT_PUBLIC_ENABLE_STILL_FRAME` | `0` | Opt-in single still frame to Gemini (not MVP) |
| `NEXT_PUBLIC_ENABLE_N8N` | `0` | Help alert |
| `NEXT_PUBLIC_ENABLE_SCRIBE` | `0` | Scribe captions |

Flags let you cut a feature without deleting code during the freeze.

## 12. Extension points

### Add a context pack

1. Add an entry to `src/lib/contexts.ts` with id, label, blurb, icon, and `promptHint`.
2. Extend `ContextId` in `contracts.ts` (announce it).
3. The selector and the mock gists read from the same config.

### Add a mock sign

1. Add to `MOCK_SIGNS` in `src/lib/mock-signs.ts`.
2. Keep the gist honest: one sentence, no invented facts.

### Add a theme

1. Add CSS variables under `[data-theme="..."]` in `globals.css`.
2. Extend `ThemeId` in `contracts.ts`.
3. Add it to the settings picker.

### Add a voice

1. Add an env var for the voice ID.
2. Extend `VoiceKey` in `contracts.ts`.
3. Add the mapping in `useSpeak`.

### Add an API route

1. Create `src/app/api/<name>/route.ts`.
2. Add a zod schema in `schemas.ts`.
3. Validate, call the provider server-side, return typed JSON or `ApiError`.
4. Document the fallback and timeout.

### Add a landing motion effect

1. Build it in `src/components/landing/` or `src/components/motion/`.
2. Use tokens and `useReducedMotion`.
3. Lazy-load if it uses Three.js.
4. Add it to the inventory in `DESIGN.md`.
5. Provide a static fallback.

### Swap a mock for real

Change one export in `src/lib/ports.ts`. Keep the prop shape identical.

## 13. Base site phases

| Phase | Scope | Owner | Priority |
|---|---|---|---|
| **B0** | Tokens, typography, themes, layout, `/app` shell, settings | P3 | Must |
| **B1** | Motion primitives and reduced-motion plumbing | P3 | Must |
| **B2** | `/` hero, conversation preview, pipeline demo, scroll sections | P3 | Must |
| **B3** | Card stack, dynamic island, parallax, infinite grid | P3 | Should |
| **B4** | Liquid, ASCII, cursor trail, polish | P3 | Could |

B0 + B1 + B2 is base site v1. Do not start B3/B4 until the conversation loop works.

## 14. Performance budget

- Target 60fps on the demo laptop; 16.6 ms per frame.
- Animate only `transform` and `opacity`.
- Lazy-load Three.js/R3F with `next/dynamic` and `ssr: false`; mount only when visible.
- Cap DPR at 1.5–2; reduce on low-end devices.
- Limit voxel cubes (e.g., 7×7 = 49) and use instanced meshes.
- Pause rendering when the tab is hidden or the canvas is offscreen.
- Skip postprocessing by default.
- Respect `prefers-reduced-motion` and the manual toggle.

## 15. Testing

- `vitest` for `normalize`, capture helpers, gist fallback, schemas, and pure helpers.
- Manual checklist for camera, audio, captions, keyboard, themes.
- axe or Lighthouse on `/` and `/app`.
- Two-device test: demo laptop + one other browser.
- Network tab check: only landmark summaries and text leave the browser.

## 16. Deploy

- Render Web Service (Node) or Vercel.
- Build: `npm ci && npm run build`; start: `npm start`.
- Set env vars in the dashboard.
- HTTPS is required for camera and mic.
- Deploy a hello page in the first hour; keep it live as a fallback.

## 17. Security and privacy

- Keys only in `.env.local` and the deploy dashboard.
- No key in client bundles or `NEXT_PUBLIC_*`.
- Validate every request with zod; cap input sizes.
- Do not upload video frames.
- Do not log full text by default.
- Rotate any leaked key immediately.

## 18. Risks

| Risk | Mitigation |
|---|---|
| MediaPipe in a worker is fiddly | Main thread first, every 2nd frame; 45-min cap |
| Gemini rate limits | Model ID in env, 5 s timeout, local fallback |
| Wrong gist | Confidence, alternatives, confirm gate |
| 3D landing eats the schedule | B0+B1+B2 only; app route has no heavy 3D |
| UI and engine drift | `ports.ts` + mocks + frozen contracts |
| Venue camera/lighting fails | Typed fallback, backup video, early venue test |
| Overclaiming | Copy rules in SPEC section 1, enforced in review |
