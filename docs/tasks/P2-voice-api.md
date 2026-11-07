# P2 — Voice/API

**Mission:** make speech and captions feel instant and safe, and make the Gemini gist cautious and honest.

Read first: [../SPEC.md](../SPEC.md) · [../ARCHITECTURE.md](../ARCHITECTURE.md) · [../ROADMAP.md](../ROADMAP.md) · [README.md](README.md)

## Files you own

```
src/app/api/speak/route.ts
src/app/api/gist/route.ts
src/app/api/scribe-token/route.ts
src/voice/useSpeak.ts
src/voice/useCaptions.ts
src/voice/audio-cache.ts
src/lib/schemas.ts
```

Do not edit `contracts.ts`, `page.tsx`, `ports.ts`, or P1's files. Ask first.

## Interfaces you expose

```ts
useSpeak(): {
  speak(text: string, voice: VoiceKey): Promise<void>;
  stop(): void;
  state: SpeakState; // { speaking, level, error? }
}

useCaptions(): {
  start(): void;
  stop(): void;
  clear(): void;
  state: CaptionState; // { listening, supported, interim, final, error? }
}

prefetchPhrases(texts: string[], voice: VoiceKey): Promise<void>
```

Routes:

- `POST /api/speak` — `SpeakRequest` → `audio/mpeg`
- `POST /api/gist` — `GistRequest` → `GistResponse`
- `GET /api/scribe-token` — short-lived token or 501

All errors: `{ error: { code, message } }`.

## Env vars

```
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_WARM=
ELEVENLABS_VOICE_CALM=
ELEVENLABS_VOICE_ENERGETIC=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
```

Keys are server-only. Never read them in a client component or expose them via `NEXT_PUBLIC_*`.

## Backlog

### P2.0 — Schemas and keys (T+0–0:45)

- [ ] Write `schemas.ts`: `SpeakRequest` (text 1–500 chars, voice enum), `GistRequest` (scenario enum; max 8 phrases × 6 candidates; confidence 0–1), `GistResponse`.
- [ ] Verify both API keys work with a minimal curl.
- [ ] Pick 3 ElevenLabs voice IDs and put them in `.env.local`.
- [ ] Confirm the current Gemini Flash model ID.

**Done when:** a curl to each provider returns a valid response.

### P2.1 — Speak (T+0:45–2:30)

- [ ] `/api/speak`: validate, call ElevenLabs `POST /v1/text-to-speech/{voice_id}` with `model_id: "eleven_flash_v2_5"`, return `audio/mpeg`.
- [ ] Map `VoiceKey` to env voice IDs. Never accept a raw voice ID from the client.
- [ ] Clear JSON errors; 500-char cap; timeout.
- [ ] `useSpeak`: fetch audio, play, track level, stop, error.
- [ ] `audio-cache.ts`: IndexedDB, key = SHA-256 of `text|voiceKey` via Web Crypto.
- [ ] `prefetchPhrases`: cache without playing.
- [ ] Fallback to `window.speechSynthesis` if ElevenLabs fails.

**Done when:** "hello" plays from ElevenLabs; the second play is instant from cache; fallback works with the key removed.

### P2.2 — Live prefetch (T+2:30–3:30)

- [ ] Expose `prefetchPhrases` to P3.
- [ ] Debounce sentence changes (~400 ms) and prefetch the full sentence.
- [ ] Do not play until the user confirms.
- [ ] Pre-warm the 7 starter phrases before the demo.

**Done when:** confirm plays near-instantly after the preview updates.

### P2.3 — Captions (T+3:30–5:00)

- [ ] `useCaptions` with the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
- [ ] Track `supported`, `listening`, `interim`, `final`, `error`.
- [ ] Handle permission denied, no speech, and unsupported browsers.
- [ ] Expose `start`, `stop`, `clear`.
- [ ] Support a typed fallback in P3's UI (no hook change needed).

**Done when:** speaking into the mic produces large captions; unsupported browsers show a clear message.

### P2.4 — Gist (T+5:00–6:30)

- [ ] `/api/gist`: validate, call Gemini with the prompt in `../GIST_PROMPT.md`, request JSON, validate with zod.
- [ ] 5 s timeout. On failure, return the raw candidate labels joined with spaces and `uncertain: true`.
- [ ] Never add facts, names, numbers, or medical details.
- [ ] Return `{ gist, uncertain, note }` only.

**Done when:** gist returns a cautious sentence; low confidence sets `uncertain: true`; fallback works with the key removed.

### P2.5 — Scribe token and security (T+6:30–7:30)

- [ ] Implement `/api/scribe-token` per current ElevenLabs docs, or return 501 with a clear message.
- [ ] Document the decision in `docs/research/P2.md`.
- [ ] Security review: no key in client bundles, no full text logs, input caps.
- [ ] Error copy is honest and actionable.

**Done when:** the route never exposes the API key; the 501 path is documented.

### P2.6 — Polish (T+13:30–16:00)

- [ ] Rate/credit safety: cap requests, reuse cache, avoid duplicate calls.
- [ ] Stop audio on unmount and on new speak.
- [ ] Waveform level smoothing.
- [ ] Scribe only if Web Speech is unusable.

**Done when:** no duplicate audio, no leaked keys, no console errors.

## Technical notes

- TTS model: `eleven_flash_v2_5`. Response is `audio/mpeg`.
- Audio cache key: SHA-256 of `text|voiceKey`.
- Web Speech API is Chrome-centric; always show `supported`.
- Gemini must be cautious: "AI guess, please confirm" is a UI requirement, not a suggestion.
- If a provider fails, degrade to the browser, not to silence.
- Never auto-speak. The user confirms.

## Guardrails

- Do not claim certainty or translation.
- Do not send video anywhere.
- Do not edit `page.tsx`; P3 owns it.
- Do not add a dependency without telling P4.

## Commands

```bash
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
```

## Report format

- Files changed
- How to run it
- Evidence: audio played, cache hit, captions, gist fallback
- Open questions
