# P4 — Base/Ship

**Mission:** unblock the team in the first hour, keep `main` green and deployed, and turn the build into a submission that wins.

Read first: [../SPEC.md](../SPEC.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md) · [../DESIGN.md](../DESIGN.md) · [../ROADMAP.md](../ROADMAP.md) · [README.md](README.md)

## Files you own

```
repo bootstrap (package.json, configs)
src/app/api/help-alert/route.ts
docs/**
README.md
scripts/**
.env.example
deploy config
```

Do not edit P1/P2/P3 source files. You are the release manager, not a second UI owner.

## Backlog

### P4.0 — Bootstrap (T+0–0:45)

The repo already has `docs/`, `README.md`, `.gitignore`, and a docs commit. `create-next-app .` may refuse to run in a non-empty folder.

- [ ] Scaffold in a temp folder (e.g. `%TEMP%/airsign-scaffold`), then copy `src/`, `package.json`, configs into the repo.
- [ ] Keep the existing `docs/`, `README.md`, and `.gitignore`; merge additions instead of overwriting.
- [ ] TypeScript strict, App Router, `src/`, alias `@/*`.
- [ ] Install runtime deps:

```bash
npm i @mediapipe/tasks-vision @elevenlabs/react @google/genai idb-keyval zod \
  lucide-react motion gsap three @react-three/fiber @react-three/drei lenis \
  clsx tailwind-merge react-use-measure
```

- [ ] Install dev deps: `vitest @vitest/coverage-v8 prettier`.
- [ ] `npx shadcn@latest init`; add button, card, slider, switch, select, badge, progress, tooltip, sonner.
- [ ] Create `src/lib/contracts.ts` from `SPEC.md` section 5, `src/lib/flags.ts`, `.env.example`, `scripts/setup-assets.mjs`.
- [ ] Add npm scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `setup:assets`.
- [ ] Commit, push `main`, tell the team to clone.

**Done when:** `npm run dev` works from a fresh clone; `main` is pushed; everyone can start.

### P4.1 — Assets, docs, deploy (T+0:45–2:00)

- [ ] `setup-assets.mjs`: copy wasm from `node_modules/@mediapipe/tasks-vision/wasm` to `public/mediapipe/wasm`; download `gesture_recognizer.task` to `public/models/` if missing; idempotent; clear messages.
- [ ] `.gitignore`: `.env*` (keep `.env.example`), `.docdex/`, `public/models/*.task`, `public/mediapipe/`, `node_modules`, `.next`, `coverage`.
- [ ] Deploy a hello page to Render or Vercel. HTTPS works.
- [ ] Set env vars in the dashboard (names only in the repo).
- [ ] Verify a fresh clone: install, setup:assets, dev.

**Done when:** deployed URL loads; camera permission prompt appears on HTTPS; assets are self-hosted.

### P4.2 — Research and story (T+2:00–4:00)

This is a judging criterion, not a side quest.

- [ ] 3 short interviews (Deaf/HoH participants, accessibility mentors, or interpreters). 5 minutes each. Ask: "What is the hardest 30-second interaction without an interpreter?" Record paraphrases with permission.
- [ ] 2 real citations for the problem. No invented statistics.
- [ ] Draft Devpost: problem, solution, impact, accessibility, honest limitations, one paragraph per prize.
- [ ] Draft the 3-minute demo script (see `ROADMAP.md`).
- [ ] Collect the Figma link from P3.
- [ ] Create `docs/research/` files for each lane and link them from `RESEARCH.md`.

**Done when:** 3 interview notes, 2 citations, a Devpost draft, and a demo script exist.

### P4.3 — Help alert and release management (T+4:00–6:00)

- [ ] `/api/help-alert`: 501 with a clear message until n8n is wired.
- [ ] Optional n8n only if Tier 0 is done by T+8:00: webhook trigger, email or chat node, real user flow. Do not bolt on a log.
- [ ] Merge o'clock: rebase, check, merge; keep `main` green.
- [ ] Verify no secrets in the repo.
- [ ] Keep the deployed URL current.

**Done when:** `main` builds and deploys; help alert is either real or clearly 501.

### P4.4 — QA and demo (T+6:00–8:00)

- [ ] Two-device test: demo laptop + one other browser.
- [ ] Venue lighting and camera test.
- [ ] Network tab proof: only text leaves the browser.
- [ ] Keyboard-only pass.
- [ ] Reduced-motion pass.
- [ ] Rough backup video of the demo path.
- [ ] Fix or file blockers with owners.

**Done when:** the demo path runs twice in a row without a crash; a rough backup video exists.

### P4.5 — Final ship (T+13:30–19:00)

- [ ] Final Devpost: problem, solution, impact, accessibility paragraph, limitations, prize paragraphs.
- [ ] Figma link, GitHub link, video ≤ 4 minutes.
- [ ] Opt in to each prize on Devpost.
- [ ] Record the final backup video before the freeze.
- [ ] Test the deployed build, not just local.
- [ ] Submit by T+19:00.
- [ ] Keep a buffer until the deadline.

**Done when:** submission is complete and the backup video plays.

## Bootstrap notes

- The docs commit is already local. Push it with the scaffold so the team can clone.
- If `create-next-app` refuses the non-empty folder, scaffold in temp and copy.
- Pin exact versions after install; commit the lockfile.
- Do not let scaffolding overwrite `docs/`, `README.md`, or the existing `.gitignore` intent.
- Camera and mic require HTTPS or `localhost`.

## Research to verify

See [../RESEARCH.md](../RESEARCH.md): R4 DeepSpace, R5 n8n, R7 deploy, R8 browser support, R11 performance.

## Guardrails

- No secrets in the repo or client bundle.
- No invented statistics or user quotes.
- Do not claim "interpreter", "translation", or "ASL translator".
- Do not merge a red `main`.
- Do not add DeepSpace or n8n unless they do a real job in a real flow.

## Commands

```bash
npm ci
npm run setup:assets
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm start
```

## Report format

- Files changed
- Deploy URL
- Evidence: fresh clone, HTTPS camera, network tab, two-device test
- Open questions
