# Roadmap

Build order for HackCamp 2026. **The conversation loop is the only required scope.** Everything after it is a bonus, and anything can be cut at a gate.

Related: [SPEC.md](SPEC.md) · [RESOURCES.md](RESOURCES.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [DESIGN.md](DESIGN.md) · [tasks/](tasks/)

## Status

- Docs and plan are updated for the conversation-window product.
- Base site is **built**: landing + `/app` on typed mocks.
- Next action: P1 real landmarks, P2 `/api/gist` + `/api/speak`, P3 wire the real modules behind `ports.ts`.
- Contracts in `src/lib/contracts.ts` are the shared language. Changes require a team announcement.

## Tiers

### Tier 0 — must be flawless

- Signer camera + hand-landmark overlay
- Capture a short sign burst (2–4 s) with a progress ring
- Coarse candidates + confidence
- `/api/gist` → Gemini → one cautious sentence
- "AI gist — please confirm" + confidence + alternatives
- Confirm → ElevenLabs speaks
- Listener reply → large live captions
- Two-sided transcript
- Themes, text size, reduced motion
- Keyboard and button fallbacks, typed reply
- Error/loading/empty states

### Tier 1 — the differentiators

- Real sign capture with normalized landmarks
- Gemini structured output + 5 s fallback
- Audio cache and pre-warmed demo phrases
- Live candidate preview while capturing
- Premium base site: tokens, shell, 3D hero, pipeline demo, scroll motion

### Tier 2 — only if genuinely ahead

- Still-frame sharing to Gemini (opt-in, off by default)
- Scribe Realtime (only if Web Speech is unusable)
- n8n help alert (one real flow, ~1 h)
- ASCII / liquid accents, cursor trail, infinite grid

### Cut by default

- Continuous sign recognition
- Open-vocabulary ASL translation
- Two-phone room
- Databricks
- Any "translator" framing

## Feature slices

Vertical slices: UI → hook → engine/API. Each slice ends with something demoable.

| ID | Slice | Owner | Support | Depends on | Done when | Target |
|---|---|---|---|---|---|---|
| **F0** | Scaffold, deps, contracts, deploy hello | P4 | P3 | — | `npm run dev` works, deployed URL live | done |
| **F1** | Shell: conversation layout, settings, 3 themes, keyboard | P3 | P4 | F0 | Shell renders with mocks; themes pass 4.5:1 | done |
| **F2** | Signer camera + HandLandmarker + skeleton overlay + states | P1 | P4 (assets) | F0 | Landmarks visible 15+ fps; denied/error states | T+2:30 |
| **F3** | Capture buffer + normalize + candidates | P1 | P3 | F2 | 3 s capture produces a stable `SignCapture` | T+4:00 |
| **F4** | `/api/gist` + Gemini + zod + 5 s fallback | P2 | P4 (key) | F1 | Real sentence returns; fallback works with no key | T+4:30 |
| **F5** | Gist confirm + speak: `/api/speak`, `useSpeak`, cache, waveform | P2 + P3 | P4 (env) | F4 | Confirm speaks; cached replay instant; fallback works | T+5:30 |
| **F6** | Reply captions: Web Speech, `aria-live`, typed fallback | P2 + P3 | — | F1 | Speech becomes captions; unsupported state clear | T+6:30 |
| **F7** | Transcript + uncertainty polish + error states | P3 | — | F5, F6 | Two-sided transcript reads like a conversation | T+7:30 |
| **F8** | Accessibility, polish, demo mode, two-device test | All | P4 (QA) | F2–F7 | axe/Lighthouse checked; keys work; no console errors | T+16:00 |
| **F9** | Ship: backup video, Devpost, Figma, README, network proof | P4 | All | F8 | Checklist complete; submitted by T+19 | T+19:00 |

## Base site phases

| Phase | Scope | Owner | Time | Priority |
|---|---|---|---|---|
| **B0** | Design tokens, typography, 3 themes, `/app` conversation shell, settings | P3 | 2–3 h | done |
| **B1** | Motion primitives: `Reveal`, `TiltCard`, `Parallax`, `Magnetic`, `useReducedMotion` | P3 | 1–2 h | done |
| **B2** | Landing: conversation hero, voxel backdrop, pipeline demo, scroll sections | P3 | 2–3 h | done |
| **B3** | Card stack, dynamic island, parallax layers | P3 | 1–2 h | Should |
| **B4** | Liquid hover, ASCII accent, cursor trail, final polish | P3 | 1–2 h | Could |

## Timeline and gates

`T+0` = start. Deadline is 12:00 PM PST on Nov 8.

| Time | Gate |
|---|---|
| T+0:45 | Base deployed; everyone cloned |
| T+2:30 | Camera + shell work. If camera fails, typed fallback carries the demo |
| T+4:30 | **Core loop works:** capture → gist → confirm → audio. If not, cut polish and fix core |
| T+5:30 | Reply captions work |
| T+7:30 | Transcript + uncertainty polished |
| T+8:00 | Integration done; **scope freeze for the night** |
| T+8:30–13:30 | **Sleep** |
| T+13:30–16:00 | Accessibility, polish, demo mode |
| T+16:00 | **Feature freeze** |
| T+19:00 | Submit |
| T+20:00 | Deadline buffer |

## Demo script (3 minutes)

| Time | Beat |
|---|---|
| 0:00–0:20 | A counter, no interpreter, typing is too slow |
| 0:20–1:00 | Live: camera on, capture a sign burst, gist appears |
| 1:00–1:20 | Confirm → the voice speaks it |
| 1:20–1:45 | Hearing person replies; captions appear on the transcript |
| 1:45–2:05 | Low confidence: "Not sure" + alternatives |
| 2:05–2:30 | Themes, keyboard-only operation, video stays on-device |
| 2:30–3:00 | Who it's for, honest limits, next step: co-design |

If a feature is not in this script, it is optional.

## Judging ownership

| Lane | Reason to win |
|---|---|
| P1 | Innovation + Technical Implementation — on-device tracking, capture |
| P2 | Technical Implementation + Gemini prize — gist, TTS, captions |
| P3 | Design & UX + Best Design + Most Accessible Design — conversation UI, themes, Figma, axe |
| P4 | Problem & User Research + Presentation + Community Impact — interviews, Devpost, video |

## Cut order

Still-frame sharing → n8n → Scribe → extra landing motion.

**Never cut:** confirm-before-speak, typed fallback, themes, the backup video.

## Out of scope

Continuous sign recognition, open-vocabulary sign-language translation, accounts, a server database, Databricks, and claims of replacing interpreters.

## Prize opt-ins

- **Overall Winner** — automatic.
- **Best Design** — opt in, submit a Figma link.
- **Community Impact** — opt in, include an impact statement.
- **Best Use of Gemini API (MLH)** — opt in, real Gemini integration.
- **Best Use of DeepSpace** — only if genuinely integrated.
- **Best use of n8n** — only if n8n does a real job in a real user flow.
- **Best Project Built with Freebuff** — optional, only if used and explained.
- **nwChoice** — automatic.
