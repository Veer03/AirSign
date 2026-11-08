# P1 — Engine

**Mission:** turn the camera into a reliable `SignCapture` on-device: hand landmarks, a short capture buffer, and coarse candidates. Video never leaves the browser.

Read first: [../SPEC.md](../SPEC.md) · [../RESOURCES.md](../RESOURCES.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md) · [../DESIGN.md](../DESIGN.md) · [../ROADMAP.md](../ROADMAP.md)

## Files you own

```
src/engine/camera.ts
src/engine/hand-landmarker.ts
src/engine/recognizer.worker.ts     # optional; main-thread fallback first
src/engine/normalize.ts
src/engine/capture.ts
src/engine/useSignCapture.ts
src/components/mocks/sign-camera.tsx   # replace the mock behind ports.ts
```

Do not edit `contracts.ts`, `page.tsx`, `ports.ts`, or P2's files. Ask first.

## Interfaces you expose

From `src/lib/contracts.ts`:

```ts
export type Candidate = { label: string; confidence: number };

export type SignCapture = {
  context: ContextId;
  frames: number;
  durationMs: number;
  candidates: Candidate[];
  summary?: number[];
};

export type CaptureStatus =
  | "idle"
  | "starting"
  | "watching"
  | "capturing"
  | "ready"
  | "denied"
  | "error";

export type SignCameraProps = {
  captureMs: number;
  enabled: boolean;
  onCapture: (capture: SignCapture) => void;
  onStatus?: (s: CaptureStatus) => void;
};
```

Keep this signature stable. P3 wires it through `ports.ts`.

## Backlog

### P1.0 — Algorithms and tests (T+0–0:45)

- [ ] `normalize.ts`: translate to wrist origin, scale by wrist→middle-finger-MCP distance, mirror left hands, flatten 21×3 to 63 floats.
- [ ] `capture.ts`: a ring buffer of N frames; produce a compact `summary` by downsampling (e.g. every 4th frame, then a fixed-length vector).
- [ ] `capture.ts`: majority vote over the last 8 frames for coarse candidates; confidence threshold 0.6.
- [ ] Vitest tests: missing landmarks, zero scale, NaN, left/right hand, empty capture.
- [ ] Decide the summary length and document it (target ≤ 256 numbers).

**Done when:** `npm run test` passes with tests that would fail on a broken implementation.

### P1.1 — Camera and landmarks (T+0:45–2:30)

- [ ] `camera.ts`: request `getUserMedia`, mirror preview, cleanup on unmount.
- [ ] Load `@mediapipe/tasks-vision` HandLandmarker in VIDEO mode.
- [ ] Use the self-hosted model at `/models/hand_landmarker.task` and wasm at `/mediapipe/wasm`.
- [ ] Optionally run GestureRecognizer for coarse labels.
- [ ] Start on the main thread, every 2nd frame. Move to a worker only if perf is clearly bad.
- [ ] Skeleton overlay on a canvas, mirrored, cyan glow, amber when uncertain.
- [ ] Status states: `idle`, `starting`, `watching`, `denied`, `error`.
- [ ] Ignore `None`.

**Done when:** landmarks are visible at 15+ fps; denied/error states are clear.

### P1.2 — Capture buffer (T+2:30–4:00)

- [ ] When capture starts, record ~2–4 s of normalized landmarks.
- [ ] Show a smooth progress ring driven by elapsed time, not layout thrash.
- [ ] Produce a `SignCapture` with `frames`, `durationMs`, `candidates`, `summary`.
- [ ] Fire `onCapture` exactly once per capture.
- [ ] Handle "no hand detected": return a clear error state, not an empty gist.
- [ ] Add a 600 ms cooldown after a capture.

**Done when:** a 3 s capture produces a stable `SignCapture`; releasing and recapturing works.

### P1.3 — Demo mode (T+4:00–4:30)

- [ ] Keep the typed mock behind `ports.ts` working.
- [ ] Expose a way to dispatch a deterministic capture for keyboard demos (Space triggers the same path).
- [ ] Make sure the demo works with the camera denied.

**Done when:** the camera path and the demo path produce the same `SignCapture` shape.

### P1.4 — Integration and polish (T+4:30–8:00, T+13:30–16:00)

- [ ] Fix integration bugs with P3.
- [ ] Venue lighting test.
- [ ] Perf pass: frame skipping, canvas size, DPR.
- [ ] Error copy is honest and actionable.
- [ ] Confirm no frame or video data is sent anywhere. Check the network tab.

**Done when:** the conversation loop runs twice in a row under venue lighting.

## Technical notes

- Camera needs HTTPS or `localhost`.
- Self-host the model and wasm. Do not rely on venue Wi-Fi.
- If worker setup takes more than 45 minutes, stay on the main thread. Ship first.
- Normalization must be identical for capture and any future matching.
- Show `unknown` rather than guessing.
- Never auto-speak. `onCapture` only produces a capture; P3 confirms.
- Do not send pixels to the server. Only the numeric summary and candidates.

## Guardrails

- Do not claim sign-language translation. Labels are "AI gist".
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
- Evidence: fps, capture length, candidate stability, no network frames
- Open questions
