# P3 — UI/Design

**Mission:** make AirSign feel premium and calm, build the base site others plug into, and make accessibility visible.

Read first: [../DESIGN.md](../DESIGN.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md) · [../SPEC.md](../SPEC.md) · [../ROADMAP.md](../ROADMAP.md) · [README.md](README.md)

## Files you own

```
src/app/page.tsx                 # landing
src/app/layout.tsx
src/app/globals.css
src/components/**                # except P1's CameraPanel/HoldRing
src/components/mocks/**
src/components/motion/**
src/lib/ports.ts
src/lib/storage.ts
src/lib/scenarios.ts
src/lib/utils.ts
```

You are the **only** editor of `page.tsx`. Do not edit P1's or P2's files, or `contracts.ts`. Ask first.

## Interfaces you consume

From `src/lib/ports.ts`, re-export either real or mock:

```ts
CameraPanel   // P1
useSpeak      // P2
useCaptions   // P2
```

Keep the mock prop shapes identical to the real ones. Swapping real ↔ mock is a one-file change.

## Design constraints

- Use tokens from `globals.css`; no hard-coded colors or spacing.
- Three themes: dark neon, high contrast, light. Contrast ≥ 4.5:1.
- Captions use Atkinson Hyperlegible; UI uses Geist/Inter.
- Motion: transform/opacity only; 40–80 ms stagger; spring for interactive.
- `prefers-reduced-motion` respected by default; manual toggle in settings.
- Heavy 3D only on `/`, lazy-loaded with `ssr: false`.
- The `/app` route stays calm: camera, strip, captions, settings. No voxel scene there.

## Backlog

### P3.0 — Figma + tokens + ports (T+0–0:45)

- [ ] Three Figma frames: landing hero, app workspace, teach flow. Keep it to 45 minutes.
- [ ] Define tokens in `globals.css`: color, type, spacing, radii, shadows, motion.
- [ ] Define three themes with `[data-theme]`.
- [ ] Create `ports.ts` and typed mocks for `CameraPanel`, `useSpeak`, `useCaptions`.
- [ ] Create `storage.ts` wrappers for settings, custom gestures, audio cache, phrases.

**Done when:** `ports.ts` compiles with mocks; tokens are usable from Tailwind classes.

### P3.1 — App shell (T+0:45–2:30)

- [ ] `/app` layout: top bar, left camera panel, right conversation column, bottom keyboard hints.
- [ ] `SettingsBar`: theme, text size, dwell, reduced motion, voice, scenario.
- [ ] `ScenarioPicker` reading from `scenarios.ts`.
- [ ] Theme switching, text scale, reduced-motion toggle persisted via `storage.ts`.
- [ ] Keyboard map: Space confirm, C clear, R reply, 1–7 demo gestures.
- [ ] Responsive: stacks cleanly on a narrow window.
- [ ] Empty/loading/error states.

**Done when:** the shell works with mocks; all three themes pass contrast; keyboard-only navigation works.

### P3.2 — Sentence strip (T+2:30–4:00)

- [ ] `SentenceStrip`: chips with remove and reorder (buttons + keyboard).
- [ ] Preview line: "Preview: …" and "Nothing is spoken until you confirm."
- [ ] `ConfirmBar`: confirm, clear, disabled/empty states.
- [ ] `HoldRing` integration with P1's props.
- [ ] Live candidate display in the camera panel area.
- [ ] Announce changes with `aria-live="polite"` where appropriate.

**Done when:** gesture → chip → preview → confirm works; remove/reorder works by mouse and keyboard.

### P3.3 — Captions and reply (T+4:00–5:00)

- [ ] `Captions`: large type, `aria-live="polite"`, interim vs final styling.
- [ ] Reply hold button (`R`), listening state, stop.
- [ ] Typed reply fallback input.
- [ ] Unsupported-browser message with a clear next step.
- [ ] No color-only state: pair with labels/icons.

**Done when:** speech becomes captions; typed fallback works; unsupported state is clear.

### P3.4 — Gist and teach UI (T+5:00–7:15)

- [ ] `GistCard`: "AI guess, please confirm", raw candidates beside it, amber uncertainty, "not sure".
- [ ] Teach flow: start, recording, name phrase, save, cancel, success.
- [ ] Wire `teach` / `onTaught` / `onTeachCancel` props.
- [ ] Show taught gestures distinctly from starter gestures.
- [ ] Loading and error states for gist.

**Done when:** gist is clearly labeled and low confidence is obvious; teach completes in under 30 seconds.

### P3.5 — Base site v1 landing (T+2:30–8:00, in parallel where possible)

Priority: B0 + B1 + B2. If the core app is behind at T+4:30, pause the landing and return after F8.

- [ ] B1 motion primitives: `Reveal`, `TiltCard`, `Parallax`, `SmoothScroll`, `useReducedMotion`.
- [ ] `/` nav, hero, problem, how it works, scenarios, features, privacy, honesty, CTA, footer.
- [ ] Hero: 3D perspective text + voxel grid (R3F, lazy, 7×7 max) + glass demo card.
- [ ] Scenario coverflow (CSS 3D + Motion drag + keyboard).
- [ ] Scroll-triggered 3D feature grid (stagger, perspective).
- [ ] Parallax layers + tilt cards.
- [ ] Dynamic island CTA.
- [ ] Static fallback for every effect.

**Done when:** landing holds 60fps on the demo laptop; reduced motion gives a clean static page; "Open AirSign" leads to `/app`.

### P3.6 — Optional B3/B4 (only if ahead)

- [ ] Cylinder/rolling text.
- [ ] 3D card stack for honesty/limits.
- [ ] Infinite drag + wheel grid.
- [ ] Liquid hover, ASCII accent, cursor trail.
- [ ] Each has a static fallback and is disabled on touch/reduced motion.

**Done when:** nothing in the app route regresses; axe still passes.

### P3.7 — Accessibility and polish (T+13:30–16:00)

- [ ] axe/Lighthouse on `/` and `/app`; fix issues; save results for Devpost.
- [ ] Focus states, skip link, landmarks, headings.
- [ ] Contrast check all themes.
- [ ] Reduced motion audit of every effect.
- [ ] Empty/loading/error states.
- [ ] Final spacing, typography, shadow polish.
- [ ] Figma link ready.

**Done when:** keyboard-only pass works; axe has no serious issues; reduced motion is clean.

## Figma deliverable

Keep it small and real:

1. Landing hero + one section.
2. App workspace with camera, strip, captions.
3. Teach flow.
4. Tokens: color, type, spacing, shadows.

Export a share link for Devpost. Do not spend more than 45 minutes before F1.

## Guardrails

- Do not call APIs from client components; use P2's hooks.
- Do not put keys in `NEXT_PUBLIC_*`.
- Do not add heavy 3D to `/app`.
- Do not copy Skiper code without checking its license; build original components.
- Do not claim translation or certainty in copy.
- Do not edit `contracts.ts`; announce changes.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## Report format

- Files changed
- How to run it
- Evidence: screenshots, fps, axe result, keyboard pass
- Open questions
