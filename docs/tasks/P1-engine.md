# P1 — Engine

**Mission:** turn the camera into reliable `GestureEvent`s, on-device, and make teach-a-gesture feel instant.

Read first: [../SPEC.md](../SPEC.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md) · [../DESIGN.md](../DESIGN.md) · [../ROADMAP.md](../ROADMAP.md) · [README.md](README.md)

## Files you own

```
src/engine/camera.ts
src/engine/recognizer.worker.ts     # optional; main-thread fallback first
src/engine/normalize.ts
src/engine/knn.ts
src/engine/hold.ts
src/engine/useGestures.ts
src/components/CameraPanel.tsx
src/components/HoldRing.tsx
```

Do not edit `contracts.ts`, `page.tsx`, `ports.ts`, or P2's files. Ask first.

## Interfaces you expose

From `src/components/CameraPanel.tsx`:

```ts
CameraPanel(props: CameraPanelProps)
```

`CameraPanelProps` is defined in `src/lib/contracts.ts`:

```ts
type CameraPanelProps = {
  dwellMs: number;
  enabled: boolean;
  onLock: (e: GestureEvent) => void;
  onStatus?: (s: GestureStatus) => void;
  teach?: TeachRequest | null;
  onTaught?: (p: Phrase) => void;
  onTeachCancel?: () => void;
};
```

Keep this signature stable. P3 wires it through `ports.ts`.

## Backlog

### P1.0 — Algorithms and tests (T+0–0:45)

- [ ] Write `normalize.ts`: translate to wrist origin, scale by wrist→middle-finger-MCP distance, mirror left hands, flatten 21×3 to 63 floats.
- [ ] Write `knn.ts`: k = 5, mean neighbour distance, rejection threshold, `unknown` result.
- [ ] Write `hold.ts`: majority vote over 8 frames, confidence ≥ 0.6, dwell timer, 600 ms cooldown.
- [ ] Write vitest tests for all three before wiring the camera.
- [ ] Edge cases: missing landmarks, zero scale, NaN, left/right hand.

**Done when:** `npm run test` passes with tests that would fail on a broken implementation.

### P1.1 — Camera and landmarks (T+0:45–2:30)

- [ ] `camera.ts`: request `getUserMedia`, mirror preview, cleanup on unmount.
- [ ] Load `@mediapipe/tasks-vision` GestureRecognizer in VIDEO mode.
- [ ] Use the self-hosted model at `/models/gesture_recognizer.task` and wasm at `/mediapipe/wasm`.
- [ ] Start on the main thread, every 2nd frame. Move to a worker only if perf is clearly bad.
- [ ] Skeleton overlay on a canvas, mirrored, cyan glow, amber when uncertain.
- [ ] Status states: `idle`, `starting`, `ready`, `denied`, `error`.
- [ ] Live candidate: top label + confidence, stabilized by the majority vote.
- [ ] Ignore `None`.

**Done when:** landmarks and a stable candidate are visible at 15+ fps; denied/error states are clear.

### P1.2 — Hold-to-lock (T+2:30–4:00)

- [ ] Integrate `hold.ts` with the live candidate.
- [ ] `HoldRing`: smooth circular progress, dwell from props, no layout thrash.
- [ ] Fire `onLock` once per hold; reset after cooldown.
- [ ] Confidence threshold 0.6 for built-in gestures.
- [ ] No duplicate locks when the hand stays still.

**Done when:** holding for 900 ms produces exactly one `GestureEvent`; releasing and re-holding works.

### P1.3 — Teach-a-gesture (T+4:00–7:30)

- [ ] When `teach` is set, record ~30 frames of normalized landmarks.
- [ ] Save samples + label via P3's `storage.ts` (coordinate the key).
- [ ] Match with kNN; reject below the calibrated threshold as `unknown`.
- [ ] Call `onTaught` with a `Phrase`; call `onTeachCancel` on cancel.
- [ ] Keep the built-in gestures working alongside custom ones.
- [ ] Calibrate the threshold with at least 2 people, 3 reps each.

**Done when:** teach a new gesture in under 30 seconds and use it immediately; a random pose is rejected.

### P1.4 — Integration and polish (T+7:30–8:00, T+13:30–16:00)

- [ ] Fix integration bugs with P3.
- [ ] Keyboard demo mode support: expose a way to dispatch the same `GestureEvent` for keys 1–7. P3 owns the keys; you own the event shape.
- [ ] Venue lighting test.
- [ ] Perf pass: frame skipping, canvas size, DPR.
- [ ] Error copy is honest and actionable.

**Done when:** the camera path and the keyboard path produce identical events; demo works under venue lighting.

## Technical notes

- Camera and mic need HTTPS or `localhost`.
- Self-host the model and wasm. Do not rely on venue Wi-Fi.
- If worker setup takes more than 45 minutes, stay on the main thread. Ship first.
- Normalization must be identical for training and matching.
- kNN threshold is a product decision: too strict feels broken, too loose says the wrong thing. Show `unknown` rather than guessing.
- Never auto-speak. `onLock` only adds a candidate; the user confirms.
- No Phase 3 DTW matcher in this task. It is a cut item.

## Guardrails

- Do not claim sign-language translation. Labels are "Starter gestures".
- Do not send frames to the server.
- Do not edit `page.tsx`; P3 owns it.
- Do not add a dependency without telling P4.

## Commands

```bash
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
npm run setup:assets
```

## Report format

- Files changed
- How to run it
- Evidence: fps, lock behavior, teach result
- Open questions
