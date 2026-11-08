# P3 — UI/Design

**Mission:** make AirSign feel like an interpreter sitting between two people — premium, calm, and honest — and keep the base site the rest of the team plugs into.

Read first: [../DESIGN.md](../DESIGN.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md) · [../SPEC.md](../SPEC.md) · [../RESOURCES.md](../RESOURCES.md) · [../ROADMAP.md](../ROADMAP.md)

## Files you own

```
src/app/page.tsx                 # landing
src/app/app/page.tsx             # workspace route
src/app/layout.tsx
src/app/globals.css
src/components/**                # except P1's real engine components
src/components/mocks/**
src/components/motion/**
src/lib/ports.ts
src/lib/contexts.ts
src/lib/mock-signs.ts
src/lib/gist.ts
src/lib/gist-client.ts
src/lib/storage.ts
src/lib/utils.ts
```

You are the **only** editor of `page.tsx`. Do not edit P1's or P2's files, or `contracts.ts`. Ask first.

## Interfaces you consume

From `src/lib/ports.ts`, re-export either real or mock:

```ts
SignCamera   // P1
useSpeak     // P2
useCaptions  // P2
```

Keep the mock prop shapes identical to the real ones. Swapping real ↔ mock is a one-file change.

## Design constraints

- Use tokens from `globals.css`; no hard-coded colors or spacing.
- Three themes: dark neon, high contrast, light. Contrast ≥ 4.5:1.
- Transcript and captions use Atkinson Hyperlegible; UI uses Inter.
- Motion: transform/opacity only; 40–80 ms stagger; spring for interactive.
- `prefers-reduced-motion` respected by default; manual toggle in settings.
- Heavy 3D only on `/`, lazy-loaded with `ssr: false`.
- The `/app` route stays calm: camera, transcript, gist, reply, settings. No voxel scene there.
- **The UI feels like an interpreter. The copy never says it is one.**

## Backlog

### P3.0 — Tokens + ports (done)

- [x] Tokens in `globals.css`: color, type, spacing, radii, shadows, motion.
- [x] Three themes with `[data-theme]`.
- [x] `ports.ts` and typed mocks for `SignCamera`, `useSpeak`, `useCaptions`.
- [x] `storage.ts` wrappers for settings. Audio cache lands with P2.

### P3.1 — Conversation shell (done)

- [x] `/app` layout: top bar, signer camera, transcript, gist confirm, reply bar, keyboard hints.
- [x] `SettingsDialog`: theme, text size, capture length, reduced motion, voice, context.
- [x] Context selector reading from `contexts.ts`.
- [x] Theme switching, text scale, reduced-motion toggle persisted via `storage.ts`.
- [x] Keyboard map: Space capture, Enter speak, R reply, C clear.
- [x] Responsive: stacks cleanly on a narrow window.
- [x] Empty/loading/error states, including camera denied and unsupported captions.

### P3.2 — Capture and gist (done, on mocks)

- [x] `SignCamera` mock: hand skeleton, scan line, capture ring, live candidates, demo states.
- [x] `GistConfirm`: big sentence, confidence, "AI gist — please confirm", alternatives, Speak / Try again.
- [x] `gist.ts`: deterministic local gist builder used as the fallback.
- [x] `gist-client.ts`: tries `/api/gist`, falls back locally when there is no key.
- [x] Nothing is spoken until **Speak** is pressed.

**Next:** P1 swaps the real `SignCamera`; P2 swaps the real `/api/gist`.

### P3.3 — Transcript and reply (done)

- [x] Two-sided transcript: signer turns left, listener turns right.
- [x] `aria-live="polite"`, auto-scroll, pause on hover/focus.
- [x] `ReplyBar`: listen, interim vs final styling, typed fallback, unsupported state.
- [x] No color-only state: pair with labels/icons.

### P3.4 — Landing (done)

- [x] `/` nav, hero, problem, how it works, pipeline demo, features, privacy, honesty, CTA, footer.
- [x] Hero: 3D perspective text + conversation-window preview + voxel backdrop.
- [x] Interactive pipeline demo: capture → gist → speak (replaces the scenario coverflow).
- [x] Scroll-triggered 3D feature grid (stagger, perspective).
- [x] Parallax layers + tilt cards.
- [x] Dynamic island CTA.
- [x] Static fallback for every effect.

### P3.5 — Real module integration (T+4:30–8:00)

- [ ] Flip `ports.ts` to P1's real `SignCamera` when it is stable.
- [ ] Flip `ports.ts` to P2's real `useSpeak` and `useCaptions`.
- [ ] Wire the real `/api/gist` through `gist-client.ts`.
- [ ] Keep the mock path behind `NEXT_PUBLIC_USE_MOCKS=1`.
- [ ] Re-test all states: denied, error, no hand, low confidence, unsupported captions.

### P3.6 — Optional B3/B4 (only if ahead)

- [ ] Cylinder/rolling text.
- [ ] 3D card stack for honesty/limits.
- [ ] Liquid hover, ASCII accent, cursor trail.
- [ ] Each has a static fallback and is disabled on touch/reduced motion.

### P3.7 — Accessibility and polish (T+13:30–16:00)

- [ ] axe/Lighthouse on `/` and `/app`; fix issues; save results for Devpost.
- [ ] Focus states, skip link, landmarks, headings.
- [ ] Contrast checked for all three themes.
- [ ] Reduced motion audit of every effect.
- [ ] Final spacing, typography, shadow polish.
- [ ] Figma link ready.

## Copy rules (review every string)

- Say **"AI gist — please confirm"**, never "translation".
- Say **"not a substitute for a human interpreter"** on both routes.
- Say **"video never leaves your browser; only landmark numbers and text are sent"**.
- Say **"gist, not translation"** at least once on the landing.
- Never say "understands sign language", "ASL translator", or "translates ASL".
- No invented statistics.

## Figma deliverable

Keep it small and real:

1. Landing hero + the pipeline demo.
2. Conversation workspace: camera, transcript, gist confirm, reply.
3. Settings and the three themes.
4. Tokens: color, type, spacing, shadows.

Export a share link for Devpost. Do not spend more than 45 minutes before F1.

## Guardrails

- Do not call APIs from client components; use P2's hooks and `gist-client.ts`.
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
