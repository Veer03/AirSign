# Resources and accounts

What to use, what each service can actually do, and what we send it. Read this before writing engine or API code.

Related: [SPEC.md](SPEC.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [RESEARCH.md](RESEARCH.md)

> **Rule:** no secret goes in the repo. Keys live in `.env.local` and the deploy dashboard only. `NEXT_PUBLIC_*` is never a key.

---

## 1. The pipeline at a glance

```
Signer's hands
  → MediaPipe HandLandmarker (browser, on-device)        ← video never leaves the device
  → normalized landmark sequence + coarse gesture candidates
  → POST /api/gist  { context, candidates, landmark summary }
  → Gemini frames ONE short first-person sentence        ← text + numbers only
  → signer confirms
  → POST /api/speak  { text, voice }
  → ElevenLabs TTS (or browser speech fallback)
  → audio plays to the hearing person

Hearing person replies
  → Web Speech API (browser) or ElevenLabs Scribe
  → large live captions on the same transcript
```

---

## 2. Google Gemini (the AI that frames the gist)

### Can Gemini "see" the camera?

Yes. The current Gemini models are multimodal and accept **text, image, audio, video, and PDF** input. But we do **not** stream the camera to Gemini by default. Two reasons:

1. **Privacy promise.** Our promise is "video never leaves your browser." Uploading frames breaks that.
2. **Latency and cost.** Streaming video to a model is slower and more expensive than sending a compact landmark sequence.

So the default is:

- **Send:** context label, normalized hand-landmark numbers, coarse candidate signs, and confidence.
- **Do not send:** pixels, video, audio, face images.
- **Optional, off by default:** a single downscaled still frame, only if the signer explicitly taps "Share one frame". If we ship it, the privacy copy must say so. It is not part of the MVP.

Gemini's job is **language framing**, not sign-language translation. It turns partial, noisy candidates into one polite first-person sentence and flags uncertainty. The UI always labels it **"AI gist — please confirm."**

### Which model

Confirmed from the Gemini API model docs on Nov 7, 2026:

| Model | ID | Use |
|---|---|---|
| **Gemini 3.8 Flash** | `gemini-3.8-flash` | **Default.** Stable, multimodal, fast enough for a 5 s budget. |
| Gemini 3.5 Flash-Lite | `gemini-3.5-flash-lite` | Cheapest/fastest fallback if rate-limited. |
| Gemini 3.8 Flash TTS | `gemini-3.8-flash-tts` | Optional voice alternative; we use ElevenLabs. |
| Gemini 3.8 Live | `gemini-3.8-live` | Real-time voice/video agent. **Not used** — sends media and breaks the privacy rule. |

`gemini-2.5-flash` and `gemini-2.5-pro` are deprecated. Do not build on them.

Set `GEMINI_MODEL=gemini-3.8-flash`. Keep it in env so a rate limit is a one-line change.

### Free tier

- Create a key in **Google AI Studio** (`aistudio.google.com`). The free tier is enough for a demo; rate limits apply.
- **Verify the current free-tier quota and model availability on our key before the demo.** Free tiers change. Record the result in `docs/RESEARCH.md` R3.
- The MLH **Best Use of Gemini API** prize is on the Devpost list. We opt in and explain the real use: gist framing over landmark candidates.

### Structured output

Request JSON, then validate with zod. Do not parse free text.

```ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        gist: { type: "string" },
        uncertain: { type: "boolean" },
        confidence: { type: "number" },
        alternatives: { type: "array", items: { type: "string" } },
        note: { type: "string" },
      },
      required: ["gist", "uncertain", "confidence", "alternatives", "note"],
    },
  },
});
```

VERIFY the exact `responseSchema` parameter names for the installed `@google/genai` version. Record it in R3.

### Fallback

If the key is missing, the call fails, or it takes longer than **5 seconds**, return a deterministic local sentence built from the candidate labels and set `uncertain: true`. The demo must never show a spinner forever.

---

## 3. MediaPipe (on-device hands)

- Package: `@mediapipe/tasks-vision` (already installed).
- Use **HandLandmarker** for the 21-point skeleton, and optionally **GestureRecognizer** for coarse built-in labels.
- Do **not** use the legacy `@mediapipe/hands` package. Google ended support in 2023.
- Self-host the wasm and the model so venue Wi-Fi cannot break the demo:
  - wasm: copy `node_modules/@mediapipe/tasks-vision/wasm` → `public/mediapipe/wasm`
  - model: `gesture_recognizer.task` and/or `hand_landmarker.task` → `public/models/`
- Run inference on the main thread first, every second frame. Move to a worker only if the frame rate is clearly bad. Cap worker work at 45 minutes.
- Normalize landmarks before sending: wrist origin, scale by wrist→middle-finger MCP, mirror left hands, flatten 21×3.
- Camera and mic need **HTTPS or localhost**.

### What we send to Gemini

```ts
type SignCapture = {
  context: ContextId;
  frames: number;            // how many landmark frames
  durationMs: number;
  candidates: Candidate[];   // coarse labels + confidence
  // Optional compact summary, never pixels:
  summary?: number[];        // downsampled normalized landmarks
};
```

---

## 4. ElevenLabs (voice out, captions in)

- TTS: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` with `model_id: "eleven_flash_v2_5"`, header `xi-api-key`. Response is `audio/mpeg`. Cap text at 500 characters.
- Pick three voice IDs in the dashboard and put them in env. Do not guess IDs.
- Captions: Web Speech API first (`SpeechRecognition` / `webkitSpeechRecognition`). It is Chrome-centric; always show `supported`.
- Scribe Realtime only if Web Speech is unusable. It needs a short-lived server token; never expose the key.
- Fallback: `window.speechSynthesis` for output, typed reply for input.

---

## 5. Everything else

| Need | Use | Notes |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict | already installed |
| Styling | Tailwind CSS v4, shadcn/ui, lucide-react | already installed |
| UI motion | `motion`, import from `motion/react` | already installed |
| 3D | Three.js + R3F + Drei | landing only, lazy-loaded |
| Validation | `zod` | every API body |
| Storage | `idb-keyval` | settings, cached audio |
| Tests | `vitest` | pure logic |
| Deploy | Render or Vercel | HTTPS for camera |

---

## 6. Environment variables

`.env.example` is committed. `.env.local` is not.

```bash
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_WARM=
ELEVENLABS_VOICE_CALM=
ELEVENLABS_VOICE_ENERGETIC=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_MOCKS=1
```

`NEXT_PUBLIC_USE_MOCKS=1` keeps curated gist responses for typed demo captures. The camera runs the local MediaPipe tracker and general handshape classifier; speech output and reply captions remain mocked until P2 connects them.

---

## 7. Prize alignment

| Prize | What we must show |
|---|---|
| Best Use of Gemini API (MLH) | `/api/gist` really calls Gemini with structured output and a fallback. |
| Best Design | The conversation UI and the Figma link. |
| Community Impact | The Deaf-led research notes and the honest limitations. |
| Overall / nwChoice | A demo that runs twice without crashing. |

Do not claim a prize we did not build for. A real integration beats a logo on a slide.
