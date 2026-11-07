# Contributing to AirSign

Four people, one weekend, one trunk. Keep it small, keep `main` green.

Read first: [SPEC.md](SPEC.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [DESIGN.md](DESIGN.md) · [ROADMAP.md](ROADMAP.md) · your task file in [tasks/](tasks/).

## Lanes

| Lane | Owns | Task file |
|---|---|---|
| **P1 Engine** | `src/engine/*`, `src/components/CameraPanel.tsx`, `src/components/HoldRing.tsx` | [tasks/P1-engine.md](tasks/P1-engine.md) |
| **P2 Voice/API** | `src/app/api/{speak,gist,scribe-token}/*`, `src/voice/*`, `src/lib/schemas.ts` | [tasks/P2-voice-api.md](tasks/P2-voice-api.md) |
| **P3 UI/Design** | `src/app/page.tsx`, `layout.tsx`, `globals.css`, components (except P1's), `src/components/mocks/*`, `src/lib/ports.ts`, `src/lib/storage.ts` | [tasks/P3-ui.md](tasks/P3-ui.md) |
| **P4 Base/Ship** | repo bootstrap, `src/app/api/help-alert/*`, `docs/*`, `README.md`, `scripts/*`, deploy config | [tasks/P4-ship.md](tasks/P4-ship.md) |

Own your lane's files. If you need a change in someone else's file or in `contracts.ts`, stop and tell your human first. Do not edit it yourself.

## Git rules

- Trunk-based. Short-lived branches: `p1/engine`, `p2/voice-api`, `p3/ui`, `p4/integrations`.
- **Merge o'clock every 60–90 minutes.** Rebase on `main`, run the checks, merge. P4 keeps `main` green.
- `main` must always build and deploy. Never force-push `main`.
- Commit style: `feat(engine): ...`, `fix(ui): ...`, `chore: ...`, `docs: ...`.
- Secrets live only in `.env.local` and the deploy dashboard. Never commit them. If a key leaks, rotate it immediately.
- Shared types change only in `src/lib/contracts.ts`, announced to the team first.
- Research findings go in your own `docs/research/<lane>.md`; P4 links them from `RESEARCH.md`.

## Definition of done

A change is done when:

1. `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.
2. It works with buttons and keyboard, not only gestures.
3. It respects `prefers-reduced-motion` and the manual reduced-motion toggle.
4. UI strings follow the honesty rules in `SPEC.md` section 1.
5. No secret, key, or `.env.local` is staged.
6. New motion uses transform/opacity, is lazy-loaded when heavy, and has a reduced-motion fallback.

## Design and motion rules

- Build original components. Skiper UI is inspiration, not a copy-paste source. If a free Skiper component is used directly, attribution is required.
- Use the design tokens in `globals.css`. No hard-coded colors or spacing in components.
- Animate `transform` and `opacity` only. No animated `box-shadow`, `filter`, or layout properties in hot paths.
- Heavy 3D (Three.js/R3F) is landing-only and lazy-loaded with `ssr: false`.
- Every interactive 3D element has a keyboard path and a visible focus state.
- Decorative canvases are `aria-hidden`; provide a text alternative for meaning.
- The app route stays fast and calm. Motion accents belong on `/`, not in the camera panel.
- Test on the demo laptop and one lower-end device. Cap DPR and cube count.

## Working with opencode

1. Read your task file and the shared docs.
2. Print a short plan and the list of files you will touch.
3. Implement in small steps. Run the checks after each step.
4. Stop at every "done when".
5. Report: files changed, how to run it, evidence it works, open questions.

No TODO comments, no lorem ipsum, no placeholder code in committed files. Mocks in `src/components/mocks/` are allowed and must be real, typed implementations.

## Schedule

| Time | Milestone |
|---|---|
| 0–0.5h | Bootstrap commit, everyone clones, env keys, demo scenario chosen |
| 0.5–1.5h | Spikes: camera landmarks, `/api/speak` hello, Figma shell, deploy hello page |
| 1.5h | **Gate:** drop failed spikes (DeepSpace first) |
| By ~6h | Tier 0 works end to end |
| By ~10h | Tier 1 |
| Sleep | Tired demos fail |
| Morning | At most one Tier 2 item |
| T-3h | **Feature freeze** |
| T-3h to T-1h | Two-device tests, backup video, Devpost, README, Figma link |
| T-1h | Submit |

## Cut order

Two-phone room → n8n → real-sign matcher → Scribe → teach-a-gesture (last resort).

**Never cut:** confirm-before-speak, button/keyboard fallbacks, themes, the backup video.
