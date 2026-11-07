# Task files

One file per person. Each is self-contained enough to paste into your own opencode workspace.

Read in this order:

1. [../SPEC.md](../SPEC.md) — the idea and honesty rules
2. [../ARCHITECTURE.md](../ARCHITECTURE.md) — base site and extension points
3. [../DESIGN.md](../DESIGN.md) — visual and motion system
4. [../ROADMAP.md](../ROADMAP.md) — tiers, slices, timeline
5. Your task file below

| Lane | File |
|---|---|
| P1 Engine | [P1-engine.md](P1-engine.md) |
| P2 Voice/API | [P2-voice-api.md](P2-voice-api.md) |
| P3 UI/Design | [P3-ui.md](P3-ui.md) |
| P4 Base/Ship | [P4-ship.md](P4-ship.md) |

## Shared rules

- **Honesty first.** Not an interpreter, not ASL translation. "Communication helper", "starter gestures", "gist, not translation". Nothing is spoken until the user confirms. Video never leaves the browser.
- **Own your files.** Do not edit another lane's files or `contracts.ts`. Ask first.
- **Contracts freeze at F0.** Any change is announced and merged by P4.
- **`ports.ts` + mocks** let UI work without engine or API.
- **Merge o'clock every 60–90 min.** Rebase, then `typecheck && lint && test && build`.
- **No TODO comments, no lorem ipsum, no placeholder code** in committed files. Mocks are allowed and must be typed.
- **Secrets stay in `.env.local`.** Never commit keys.
- **Motion rules:** transform/opacity only, reduced-motion fallback, heavy 3D lazy-loaded on `/` only.

## Dependency graph

```
P4 scaffold (F0)
  ├── P3 shell (F1) ──┬── P3 sentence strip (F3) ── P1 hold (F3) ── P1 teach (F6)
  │                   ├── P2 speak (F4) ── P2 gist (F7)
  │                   ├── P2 captions (F5)
  │                   └── P1 camera (F2)
  └── P4 deploy, assets, docs
```

## First 30 minutes, in parallel

| Person | Do this now |
|---|---|
| P4 | Scaffold in a temp folder, copy into the repo, push `main` |
| P3 | Figma frames, tokens, `ports.ts` + mock design |
| P1 | Write `normalize` / `knn` / `hold` test cases |
| P2 | Draft schemas and route behavior; verify keys and voice IDs |

## Status board

Update this table as you go.

| Slice | Owner | Status |
|---|---|---|
| F0 Scaffold | P4 | todo |
| F1 Shell | P3 | todo |
| F2 Camera | P1 | todo |
| F3 Hold + strip | P1 + P3 | todo |
| F4 Speak | P2 + P3 | todo |
| F4.5 Live preview | P1 + P2 + P3 | todo |
| F5 Captions | P2 + P3 | todo |
| F6 Teach | P1 + P3 | todo |
| F7 Gist | P2 + P3 | todo |
| F8 Polish | All | todo |
| F9 Ship | P4 | todo |

## Report format

When you finish a step, report:

- Files changed
- How to run it
- Evidence it works (what you saw)
- Open questions or blockers

## Merge checklist

- [ ] Rebased on `main`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] No secrets staged
- [ ] Reduced motion still works
- [ ] Keyboard path still works
