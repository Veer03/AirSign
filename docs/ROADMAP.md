# Roadmap

Build order for HackCamp 2026. Phase 1 is the only required scope. Everything after it is a bonus, and anything can be cut at the gate.

## Phase 1 — MVP (must work end to end)

| # | Item | Lane | Status |
|---|---|---|---|
| 1 | Camera view with glowing hand-skeleton overlay (mirrored) | P1 | todo |
| 2 | Starter gestures mapped to editable phrases | P1 | todo |
| 3 | Hold-to-lock with a circular progress ring, dwell 500–2000 ms | P1 | todo |
| 4 | Sentence strip: chips removable and reorderable | P3 | todo |
| 5 | Confirm button, then ElevenLabs speaks the sentence (three voice presets) | P2 | todo |
| 6 | Reply mode with large high-contrast live captions (Web Speech API first) | P2 | todo |
| 7 | Everything operable by buttons and keyboard (Space, C, R) | P3 | todo |
| 8 | Themes: dark neon, high-contrast yellow on black, light; text size; reduced motion | P3 | todo |

## Phase 2 — stand-out features

| # | Item | Lane | Status |
|---|---|---|---|
| 9 | Teach-a-gesture: ~30 frames, name a phrase, IndexedDB, kNN with rejection | P1 | todo |
| 10 | Pre-rendered and cached audio for saved phrases | P2 | todo |
| 11 | Reply captions via ElevenLabs Scribe Realtime (fallback: Web Speech API) | P2 | todo |
| 12 | Gemini "gist" with visible uncertainty; user always confirms | P2 | todo |

## Phase 3 — stretch (at most one or two, only after Phase 2 is solid)

| # | Item | Lane | Status |
|---|---|---|---|
| 13 | Gist mode for real signs: 15–25 verified signs, pose landmarks, DTW, top 3 candidates | P1 | todo |
| 14 | Two-phone conversation room (DeepSpace sync) | P4 | todo |
| 15 | n8n help alert triggered by "I need help" | P4 | todo |

**Phase 3 go/no-go:** at least ~85% accuracy on held-out tests with three different people, else label experimental or cut.

## Out of scope

Continuous sign recognition, open-vocabulary ASL translation, accounts or login, a server database, Databricks, and claims of replacing interpreters.

## Milestones

- **0–0.5h** — bootstrap, clones, env keys, demo scenario chosen.
- **0.5–1.5h** — spikes (camera, speak, Figma shell, deploy hello page).
- **1.5h** — gate: drop failed spikes (DeepSpace first).
- **~6h** — Phase 1 end to end.
- **~10h** — Phase 2.
- **Sleep.**
- **Morning** — at most one Phase 3 item.
- **T-3h** — feature freeze.
- **T-3h to T-1h** — device tests, backup video, Devpost, README, Figma link.
- **T-1h** — submit.

## Prize opt-ins (each needs a short written explanation)

- **Overall Winner** — automatic.
- **Best Design** — opt in, submit a Figma link.
- **Community Impact** — opt in, include an impact statement.
- **Best Use of Gemini API (MLH)** — opt in, real Gemini integration.
- **Best Use of DeepSpace** — only if genuinely integrated.
- **Best use of n8n** — only if n8n does a real job in a real user flow.
- **Best Project Built with Freebuff** — optional, only if used and explained.
- **nwChoice** — automatic.

## Cut order

Two-phone room → n8n → Phase 3 sign matcher → Scribe (keep Web Speech fallback).

**Never cut:** confirm-before-speak, button fallbacks, themes, the backup video.
