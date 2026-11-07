# Roadmap

Build order for HackCamp 2026. **Phase 1 is the only required scope.** Everything after it is a bonus, and anything can be cut at a gate.

Related docs: [ARCHITECTURE.md](ARCHITECTURE.md) · [DESIGN.md](DESIGN.md) · [tasks/](tasks/) · [CONTRIBUTING.md](CONTRIBUTING.md)

## Status

- Docs and plan are written.
- Base site is **not built yet**.
- Next action: P4 scaffolds the app and deploys a hello page; P3 starts the design system and shell.
- Contracts in `src/lib/contracts.ts` are frozen once F0 lands. Changes require a team announcement.

## Tiers

### Tier 0 — must be flawless

- Camera + skeleton overlay
- 7 starter gestures → editable phrases
- Live candidate + confidence
- Hold-to-lock ring, dwell 500–2000 ms
- Sentence strip (remove/reorder)
- Confirm → ElevenLabs speaks (3 voices)
- Reply mode with Web Speech captions
- Themes, text size, reduced motion
- Keyboard and button fallbacks
- Error/loading/empty states

### Tier 1 — the differentiators

- Teach-a-gesture (kNN + rejection)
- Gemini gist with visible uncertainty
- Audio cache and pre-warmed demo phrases
- Live sentence preview + audio prefetch
- Premium base site: tokens, shell, 3D hero, coverflow, scroll motion

### Tier 2 — only if genuinely ahead

- n8n help alert (one real flow, ~1 h)
- Scribe Realtime (only if Web Speech is unusable)
- ASCII / liquid accents, cursor trail, infinite grid

### Cut by default

- Phase 3 real-sign DTW matcher
- DeepSpace two-phone room
- Freebuff, Databricks
- Any "translator" framing

## Feature slices

Vertical slices: UI → hook → engine/API. Each slice ends with something demoable.

| ID | Slice | Owner | Support | Depends on | Done when | Target |
|---|---|---|---|---|---|---|
| **F0** | Scaffold, deps, contracts, deploy hello | P4 | P3 (ports/mocks) | — | `npm run dev` works, deployed URL live, contracts frozen | T+0:45 |
| **F1** | Shell: layout, settings bar, scenario picker, 3 themes, text scale, reduced motion, keyboard map | P3 | P4 | F0 | Shell renders with mocks; themes pass 4.5:1; keyboard works | T+2:30 |
| **F2** | Camera + MediaPipe + skeleton overlay + status states | P1 | P4 (assets) | F0 | Landmarks visible 15+ fps; denied/error states | T+2:30 |
| **F3** | Hold-to-lock + sentence strip | P1 + P3 | — | F1, F2 | 900 ms locks once; chip appears; remove/reorder; no duplicates | T+4:00 |
| **F4** | Speak: `/api/speak`, `useSpeak`, cache, prefetch, fallback, waveform, confirm button | P2 + P3 | P4 (env) | F1 | Confirm speaks; cached replay instant; fallback works | T+4:30 |
| **F4.5** | Live candidate + sentence preview + audio prefetch (no auto-speak) | P1 + P2 + P3 | — | F4 | Candidate updates live; preview updates; confirm is near-instant | T+5:30 |
| **F5** | Reply captions: Web Speech hook, `aria-live` captions, hold R, typed fallback | P2 + P3 | — | F1 | Speech becomes captions; unsupported state clear | T+5:30 |
| **F6** | Teach-a-gesture: normalize, kNN, IndexedDB, record 30 frames, name phrase, use it | P1 + P3 | — | F3 | Teach and recognize a new gesture; unknown rejection works | T+7:30 |
| **F7** | Gemini gist: route, prompt, 5 s timeout, fallback, uncertainty UI | P2 + P3 | P4 (key) | F4 | Gist returns; low confidence shows "not sure"; fallback works | T+7:00 |
| **F8** | Accessibility, polish, demo mode, two-device test | All | P4 (QA) | F3–F7 | axe/Lighthouse checked; keys 1–7; no console errors | T+16:00 |
| **F9** | Ship: backup video, Devpost, Figma, README, network proof, submit | P4 | All | F8 | Checklist complete; submitted by T+19 | T+19:00 |

## Base site phases

The base site is split so the app works even if the landing is unfinished.

| Phase | Scope | Owner | Time | Priority |
|---|---|---|---|---|
| **B0** | Design tokens, typography, 3 themes, app shell at `/app`, settings bar | P3 | 2–3 h | Must |
| **B1** | Motion primitives: `Reveal`, `TiltCard`, `Parallax`, `SmoothScroll`, `useReducedMotion` | P3 | 1–2 h | Must |
| **B2** | Landing at `/`: voxel hero, 3D perspective text, scenario coverflow, scroll feature grid | P3 | 2–3 h | Must |
| **B3** | Card stack, dynamic island, parallax layers, infinite drag grid | P3 | 1–2 h | Should |
| **B4** | Liquid hover, ASCII accent, cursor trail, final polish | P3 | 1–2 h | Could |

B0 + B1 + B2 is "base site v1". B3/B4 only if the core app is on track.

## Timeline and gates

`T+0` = start. Deadline is 12:00 PM PST on Nov 8.

| Time | Gate |
|---|---|
| T+0:45 | Base deployed; everyone cloned |
| T+2:30 | Camera + shell work. If camera fails, keyboard demo mode carries the demo |
| T+4:30 | **Core loop works:** gesture → chip → confirm → audio. If not, cut teach/gist and fix core |
| T+5:30 | Live preview + reply captions work |
| T+7:30 | Teach + gist work |
| T+8:00 | Integration done; **scope freeze for the night** |
| T+8:30–13:30 | **Sleep** |
| T+13:30–16:00 | Accessibility, polish, demo mode |
| T+16:00 | **Feature freeze** |
| T+19:00 | Submit |
| T+20:00 | Deadline buffer |

## Demo script (3 minutes)

| Time | Beat |
|---|---|
| 0:00–0:20 | Pharmacy counter, no interpreter, typing is slow |
| 0:20–0:50 | Live: gesture → live candidate → chip → confirm → spoken sentence |
| 0:50–1:20 | Teach a new gesture on the spot, then use it |
| 1:20–1:40 | Hearing person replies; captions appear |
| 1:40–2:10 | Gist with "AI guess, please confirm" + low-confidence "not sure" |
| 2:10–2:30 | Themes, keyboard-only operation, video stays on-device |
| 2:30–3:00 | Who it's for, honest limits, next step: co-design with Deaf users |

If a feature is not in this script, it is optional.

## Judging ownership

| Lane | Reason to win |
|---|---|
| P1 | Innovation + Technical Implementation — on-device tracking, teach-a-gesture |
| P2 | Technical Implementation + Gemini prize — TTS, gist, captions |
| P3 | Design & UX + Best Design + Most Accessible Design — themes, Figma, axe |
| P4 | Problem & User Research + Presentation + Community Impact — interviews, Devpost, video |

## Cut order

DeepSpace → n8n → real-sign DTW → Scribe → teach-a-gesture (last resort).

**Never cut:** confirm-before-speak, keyboard/button fallbacks, themes, the backup video.

## Out of scope

Continuous sign recognition, open-vocabulary sign-language translation, accounts or login, a server database, Databricks, and claims of replacing interpreters.

## Prize opt-ins

- **Overall Winner** — automatic.
- **Best Design** — opt in, submit a Figma link.
- **Community Impact** — opt in, include an impact statement.
- **Best Use of Gemini API (MLH)** — opt in, real Gemini integration.
- **Best Use of DeepSpace** — only if genuinely integrated.
- **Best use of n8n** — only if n8n does a real job in a real user flow.
- **Best Project Built with Freebuff** — optional, only if used and explained.
- **nwChoice** — automatic.
