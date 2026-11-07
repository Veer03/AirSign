# Architecture

How the base site is put together, and how to build on it without rewrites.

This is the instruction doc for the foundation. The UI itself is **not implemented yet**; this describes what to build and where features plug in.

Related: [DESIGN.md](DESIGN.md) · [ROADMAP.md](ROADMAP.md) · [tasks/](tasks/)

## 1. What the base site is

A runnable Next.js foundation with:

- Two routes: `/` (premium landing) and `/app` (communication workspace).
- One design system: tokens, themes, typography, motion primitives.
- Shared contracts and typed interfaces between lanes.
- `ports.ts` + mocks so UI work never blocks on engine or API work.
- Feature flags for experimental work.
- Server routes with keys kept server-side.
- A deploy target that works over HTTPS.

It is **not** a marketing template. The landing exists to tell the story and lead into the working app. The app is the product.

## 2. Goals and non-goals

**Goals**

- Something demoable lands every 1–2 hours.
- P1, P2, and P3 can work in parallel from hour one.
- Features are added by composition, not by editing a monolith.
- The app route stays fast, accessible, and calm.
- The landing can carry the premium 3D motion without risking the demo.

**Non-goals**

- A CMS, accounts, a database, or multi-tenant infrastructure.
- Continuous sign recognition or open-vocabulary translation.
- 3D on every screen. Motion is an accent, not the product.

## 3. Routes

| Route | Purpose | Owner |
|---|---|---|
| `/` | Landing: problem, how it works, scenarios, features, privacy, honesty, CTA | P3 |
| `/app` | Workspace: camera, hold ring, sentence strip, captions, gist, settings | P3 shell, P1/P2 features |
| `/api/speak` | Text → ElevenLabs audio (`audio/mpeg`) | P2 |
| `/api/gist` | Candidates → cautious sentence + uncertainty | P2 |
| `/api/scribe-token` | Short-lived Scribe token, or 501 until verified | P2 |
| `/api/help-alert` | n8n webhook, or 501 until wired | P4 |

The demo opens on `/` for the story, then moves to `/app` for the live interaction.

## 4. Stack (confirmed Nov 7, 2026)

| Package | Version | Notes |
|---|---|---|
| `next` | 16.4.5 | App Router, route handlers |
| `react` / `react-dom` | 19.3.1 | |
| `typescript` | strict | |
| `tailwindcss` | 4.3.5 | CSS-first config, `@theme` |
| `shadcn/ui` | CLI | Radix primitives, copied into the repo |
| `lucide-react` | latest | icons |
| `motion` | 14.10.1 | formerly Framer Motion; import from `motion/react` |
| `gsap` | 3.15.1 | free for all users, including ScrollTrigger and SplitText |
| `three` | 0.187.0 | |
| `@react-three/fiber` | 9.8.2 | React 19 compatible |
| `@react-three/drei` | 10.7.9 | helpers, `AsciiRenderer`, `ContactShadows` |
| `@react-three/postprocessing` | 3.2.2 | optional; skip by default for perf |
| `lenis` | 1.3.27 | optional smooth scroll |
| `clsx` + `tailwind-merge` | latest | `cn()` helper |
| `react-use-measure` | latest | component sizing |
| `@mediapipe/tasks-vision` | latest | GestureRecognizer |
| `@elevenlabs/react` | latest | Scribe hook |
| `@google/genai` | latest | Gemini |
| `idb-keyval` | latest | IndexedDB |
| `zod` | latest | validation |
| `vitest` | latest | pure-logic tests |

Pin exact versions after install and commit the lockfile.

## 5. Folder structure

```
src/
  app/
    layout.tsx                 # fonts, theme provider, metadata
    page.tsx                   # landing
    app/page.tsx               # workspace
    globals.css                # tokens, themes, base styles
    api/
      speak/route.ts
      gist/route.ts
      scribe-token/route.ts
      help-alert/route.ts
  components/
    ui/                        # shadcn primitives
    landing/                   # P3: hero, voxel, coverflow, scroll sections
    motion/                    # P3: Reveal, TiltCard, Parallax, SmoothScroll
    mocks/                     # P3: typed stand-ins for engine/voice
    CameraPanel.tsx            # P1
    HoldRing.tsx               # P1
    SentenceStrip.tsx          # P3
    Captions.tsx               # P3
    GistCard.tsx               # P3
    SettingsBar.tsx            # P3
    ScenarioPicker.tsx         # P3
    Waveform.tsx               # P3
    DynamicIsland.tsx          # P3
  engine/                      # P1
    camera.ts
    recognizer.worker.ts       # optional; main-thread fallback first
    normalize.ts
    knn.ts
    hold.ts
    useGestures.ts
  voice/                       # P2
    useSpeak.ts
    useCaptions.ts
    audio-cache.ts
  lib/
    contracts.ts               # P4 commits; frozen after F0
    schemas.ts                 # P2
    starter-phrases.ts         # shared data
    scenarios.ts               # scenario packs (P3)
    ports.ts                   # P3: real ↔ mock switch
    storage.ts                 # P3: idb-keyval wrappers
    flags.ts                   # P4: feature flags
    utils.ts                   # cn()
  tests/                       # vitest
```

## 6. Data flow

```
Camera (browser)
  → MediaPipe GestureRecognizer (on-device)
  → majority vote + hold timer
  → GestureEvent
  → sentence strip (chips)
  → confirm
  → POST /api/speak (text + voice)
  → ElevenLabs TTS
  → audio/mpeg → play (or cached in IndexedDB)

Hearing person speaks
  → Web Speech API (browser) or Scribe
  → captions (aria-live)

Chips + candidates
  → optional POST /api/gist
  → Gemini → { gist, uncertain, note }
  → "AI guess, please confirm"
```

Video frames never leave the browser. Only text is sent to the server.

## 7. Contracts and ports

`src/lib/contracts.ts` is the shared language. It is committed by P4 and frozen after F0. Any change is announced before merging.

`src/lib/ports.ts` is the swap point:

```ts
// Shape, not final code.
export { CameraPanel } from '@/components/CameraPanel';        // real
// or
export { CameraPanel } from '@/components/mocks/CameraPanel';  // mock
```

P3 builds the shell against mocks. When P1/P2 ship the real module, P3 flips one import. No page rewrite.

## 8. State management

- Local component state for ephemeral UI.
- One `SettingsProvider` (React context + `useReducer`) for theme, text scale, dwell, reduced motion, voice, scenario.
- One `SentenceProvider` for chips, preview, and confirm state.
- Persist settings and custom gestures with `idb-keyval` via `storage.ts`.
- No Redux, no Zustand unless a real need appears.

## 9. API routes

Every route:

1. Parses with a zod schema.
2. Returns `ApiError` JSON on failure: `{ error: { code, message } }`.
3. Keeps keys server-side.
4. Has a timeout and a clear fallback.
5. Caps input (speak: 500 chars; gist: 8 phrases × 6 candidates).

`/api/speak` returns `audio/mpeg`. `/api/gist` returns `GistResponse`. `/api/scribe-token` and `/api/help-alert` return 501 with a clear message until verified or wired.

## 10. Storage

| Key | Contents |
|---|---|
| `airsign:settings` | `Settings` |
| `airsign:custom-gestures` | taught samples + labels |
| `airsign:audio:<sha256>` | cached MP3 blobs |
| `airsign:phrases` | edited starter phrase text |

All storage is local to the browser. No server database.

## 11. Feature flags

`src/lib/flags.ts`, driven by `NEXT_PUBLIC_*` env vars with safe defaults:

| Flag | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCKS` | `0` | Force mocks for UI work |
| `NEXT_PUBLIC_ENABLE_LANDING_3D` | `1` | Toggle heavy landing motion |
| `NEXT_PUBLIC_ENABLE_TEACH` | `1` | Teach-a-gesture |
| `NEXT_PUBLIC_ENABLE_GIST` | `1` | Gemini gist |
| `NEXT_PUBLIC_ENABLE_N8N` | `0` | Help alert |
| `NEXT_PUBLIC_ENABLE_SCRIBE` | `0` | Scribe captions |

Flags let you cut a feature without deleting code during the freeze.

## 12. Extension points

### Add a starter gesture

1. Add the MediaPipe label and phrase to `src/lib/starter-phrases.ts`.
2. Add the phrase text to the scenario pack if it differs by scenario.
3. No UI change: the camera panel renders the label and confidence.

### Add a scenario pack

1. Add an entry to `src/lib/scenarios.ts` with id, label, icon, phrases.
2. The scenario picker and coverflow read from the same config.

### Add a theme

1. Add CSS variables under `[data-theme="..."]` in `globals.css`.
2. Extend `ThemeId` in `contracts.ts` (announce it).
3. Add it to the settings picker.

### Add a voice

1. Add an env var for the voice ID.
2. Extend `VoiceKey` in `contracts.ts` (announce it).
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

### Add a feature flag

Add the env var to `.env.example`, read it in `flags.ts`, default to off for experimental work.

### Add a custom gesture

P1 records samples, normalizes, and stores them under `airsign:custom-gestures`. P3's teach UI calls the same `CameraPanel` props with `teach` set.

## 13. Base site phases

| Phase | Scope | Owner | Priority |
|---|---|---|---|
| **B0** | Tokens, typography, themes, layout, `/app` shell, settings | P3 | Must |
| **B1** | Motion primitives and reduced-motion plumbing | P3 | Must |
| **B2** | `/` hero, voxel grid, 3D text, coverflow, scroll grid | P3 | Must |
| **B3** | Card stack, dynamic island, parallax, infinite grid | P3 | Should |
| **B4** | Liquid, ASCII, cursor trail, polish | P3 | Could |

B0 + B1 + B2 is base site v1. Do not start B3/B4 until the core app works.

## 14. Performance budget

- Target 60fps on the demo laptop; 16.6 ms per frame.
- Animate only `transform` and `opacity`.
- Lazy-load Three.js/R3F with `next/dynamic` and `ssr: false`; mount only when visible.
- Cap DPR at 1.5–2; reduce on low-end devices.
- Limit voxel cubes (e.g., 7×7 = 49) and use instanced meshes.
- Pause rendering when the tab is hidden or the canvas is offscreen.
- Skip postprocessing by default. Bloom only if it holds 60fps.
- No cursor trail or liquid effects on touch devices.
- Respect `prefers-reduced-motion` and the manual toggle.

## 15. Testing

- `vitest` for `normalize`, `knn`, `hold`, schemas, and pure helpers.
- Manual checklist for camera, audio, captions, keyboard, themes.
- axe or Lighthouse on `/` and `/app`.
- Two-device test: demo laptop + one other browser.
- Network tab check: only text requests leave the browser.

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
| Scaffold blocks everyone | P4 does it first; P1/P2/P3 work in scratch or against contracts |
| MediaPipe in a worker is fiddly | Main thread first, every 2nd frame; 45-min cap |
| 3D landing eats the schedule | B0+B1+B2 only; app route has no heavy 3D |
| UI and engine drift | `ports.ts` + mocks + frozen contracts |
| Merge conflicts in `page.tsx` | P3 is the only editor |
| Venue camera/lighting fails | Keyboard demo mode, backup video, early venue test |
