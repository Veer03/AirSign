# Contributing to AirSign

Four people, one weekend, one trunk. Keep it small, keep `main` green.

## Lanes

| Lane | Owns | First spike |
|---|---|---|
| **P1 Engine** | `src/engine/*` | Camera plus hand landmarks on screen |
| **P2 Voice/API** | `src/app/api/*`, `src/voice/*` | `/api/speak` plays "hello" in the browser |
| **P3 UI/Design** | `src/components/*`, `page.tsx` | Figma frames and accessible shell |
| **P4 Integrations/Ship** | Deploy, DeepSpace, n8n, docs, Devpost | Hello page deployed over HTTPS |

Own your lane's files. If you need to change a shared type, change `src/lib/contracts.ts` only and announce it in the team chat first.

## Git rules

- Trunk-based. Short-lived branches: `p1/engine`, `p2/voice-api`, `p3/ui`, `p4/integrations` (or a focused branch per task).
- Merge to `main` often — at least every 1–2 hours — after `npm run typecheck && npm run build` passes.
- `main` must always build and deploy. Never force-push `main`. Rebase on `main` before merging.
- Commit style: `feat(engine): ...`, `fix(ui): ...`, `chore: ...`, `docs: ...`.
- Secrets live only in `.env.local` and the deploy dashboard. Never commit them.
- Pull requests are optional for a 4-person team; a quick self-check plus a passing build is the gate.

## Definition of done

A change is done when:

1. `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.
2. It works with buttons and keyboard, not only gestures.
3. UI strings follow the honesty rules in `docs/SPEC.md` section 1.
4. No secret, key, or `.env.local` is staged.

## Schedule (adjust once you know the hours left)

| Time | Milestone |
|---|---|
| 0–0.5h | Bootstrap commit, everyone clones, env keys, pick the demo scenario |
| 0.5–1.5h | Spikes: camera landmarks, `/api/speak` hello, Figma shell, deploy hello page |
| 1.5h | **Gate:** drop any spike that failed (DeepSpace first) |
| By ~6h | Phase 1 works end to end |
| By ~10h | Phase 2 |
| Sleep | Tired demos fail |
| Morning | At most one Phase 3 item |
| T-3h | **Feature freeze** |
| T-3h to T-1h | Test on two devices, record backup demo, finish Devpost, README, Figma link |
| T-1h | Submit |

## Cut order if behind

1. Two-phone room
2. n8n help alert
3. Phase 3 sign matcher
4. Scribe (keep the Web Speech fallback)

**Never cut:** confirm-before-speak, button fallbacks, themes, the backup video.
