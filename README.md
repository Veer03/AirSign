# AirSign

**Sign in the air. Hear it out loud. Learn ASL while you play.**

AirSign is a browser app that turns hand signs and gestures into spoken words. Point your camera at your hands, hold a sign for a moment, and AirSign speaks it in a natural voice. Everything about your video stays on your device.

It is built for two things: **communicating** in quick, everyday moments, and **learning and practising basic ASL** in a way that feels like a game.

---

## Who it's for

### People who can't speak or can't hear
Deaf and hard-of-hearing people, non-verbal people, and people with speech difficulties can use AirSign to get a short message across when typing is too slow and no interpreter is around. Think of a pharmacy counter, a shop, a classroom or a doctor's waiting room.

1. Make a sign or gesture. AirSign shows what it thinks you mean.
2. Hold it until the ring fills. The phrase is added to your sentence.
3. Tap **Speak**. A natural voice says it out loud.
4. The other person replies by talking, and their words appear as **large, high-contrast captions**.

### Learners of ASL: kids, families and friends
AirSign is a friendly way to start learning sign language:

- **Alphabet and numbers.** Sign letters A–Z and numbers 0–10 and get instant feedback from the camera.
- **Practice drill.** Press *Practice*, get a random letter or number, sign it, and see a green check when you get it right. Then go again.
- **Reference charts.** Open the alphabet and number charts any time you get stuck.
- **Real ASL words.** Try "ASL words" mode, which recognizes around 250 common isolated signs.
- **Hear it.** Every sign you lock can be spoken out loud, so learners connect the sign with the word.

### Kids and classrooms
Children love seeing their hands turn into a glowing skeleton on screen and hearing their signs spoken back. AirSign makes signing playful: no sign-up, no typing, just your hands and a camera. It works well for:

- teaching hearing children their first signs, so they can talk with Deaf classmates, siblings or relatives
- helping Deaf and hard-of-hearing children practise at home
- short, fun classroom activities ("Who can spell their name first?")

### Anyone who wants their own signs
With **Your gestures** mode you can invent your own signs. Record a hand pose or a movement, with one hand or two, give it a phrase, and AirSign will recognize it from then on. It's great for family signs, personal shortcuts, or signs a child has made up.

---

## What you can do

| Mode | What it does |
|---|---|
| **Quick phrases** | Built-in hand gestures (thumbs up, open palm, fist, victory…) mapped to everyday phrases like "Please wait" or "Yes, that one". Two-hand combos unlock more phrases. |
| **ASL · alphabet** | Recognizes static ASL letters. Choose between a kNN matcher trained on our own labelled samples or a small pretrained neural network. |
| **ASL · numbers** | Recognizes static ASL numbers 0–10. |
| **ASL · words** | Recognizes around 250 isolated ASL signs from your hands, face and body, using a model from the Kaggle "asl-signs" competition. |
| **Your gestures** | Record your own one- or two-hand pose or motion and choose what it says. |
| **Practice** | A random letter or number to sign, with a green check when you nail it. |
| **Reply captions** | The hearing person holds a button and speaks; their words appear as big captions. |

Also included:

- **Hold to lock.** A circular ring fills while you hold a sign (adjustable, 100–900 ms), so random hand movements don't trigger anything.
- **Sentence strip.** Locked phrases become chips you can remove before speaking.
- **Confirm, then speak.** Nothing is said out loud until you choose to.
- **Three voices.** Warm, calm or energetic, powered by ElevenLabs.
- **Keyboard fallback.** Keys 1–9 add the same phrases when the camera isn't practical.
- **Front or rear camera**, GPU or CPU processing, and phone support.

## Privacy

**Your video never leaves your browser.** Hand tracking, sign recognition and your custom gestures all run on your device. Only the text you choose to speak is sent to the server to be turned into audio. Your settings and recorded gestures are saved in your own browser.

---

## How it works

```
camera → MediaPipe finds hand (and body) points → smoothing + hand tracking
       → classifier guesses the sign → hold-to-lock → sentence strip
       → you confirm → /api/speak → ElevenLabs voice
```

- **MediaPipe** (Google) finds 21 points on each hand, or the full face, body and hands for ASL words, directly in the browser.
- **ONNX Runtime Web** runs the ASL models in the browser, on the GPU (WebGPU) when available and WebAssembly otherwise.
- **Rule-based and kNN classifiers** handle quick phrases, numbers and your custom gestures.
- A **stabilizer** waits for a steady hold before locking, so the app doesn't flicker or repeat itself.
- The only server route, **`/api/speak`**, calls ElevenLabs with a secret key that never reaches the browser.

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, lucide-react icons |
| Fonts | Atkinson Hyperlegible for captions; IBM Plex Sans / Mono for UI |
| Hand and body tracking | MediaPipe Tasks Vision (GestureRecognizer, HolisticLandmarker) |
| On-device models | ONNX Runtime Web (WebGPU with WASM fallback) |
| Voice | ElevenLabs `eleven_flash_v2_5` |
| Reply captions | Browser Web Speech API |
| Storage | `idb-keyval` (IndexedDB) |
| Validation | `zod` |
| Tests | `vitest` |
| Hosting | Render or Vercel (HTTPS required for camera and mic) |

Planned: Gemini "gist" to join signs into one cautious sentence, and an optional n8n help alert.

## Quick start

```bash
npm install
npm run setup:assets         # copy MediaPipe/ONNX wasm and download the models
cp .env.example .env.local   # add your own keys
npm run dev                  # open http://localhost:3000
```

Add `ELEVENLABS_API_KEY` to `.env.local` to turn on the voice. Without it, the app still recognizes signs and fills the sentence strip, and `/api/speak` returns a clear 503. Optionally set `ELEVENLABS_VOICE_WARM`, `ELEVENLABS_VOICE_CALM` and `ELEVENLABS_VOICE_ENERGETIC` to your own voice IDs.

Camera and microphone access need HTTPS or `localhost`.

Other commands: `npm test` (unit tests), `npm run typecheck`, `npm run build`.

## Status

- Working: landing page, `/app` workspace, one- and two-hand tracking, quick phrases and two-hand combos, ASL alphabet (kNN and pretrained), ASL numbers, ASL words, custom gestures (pose and motion), practice drill, sentence strip, reply captions, keyboard fallback, and ElevenLabs speech.
- `npm test` passes: 70 tests in 13 files.
- Not built yet: Gemini gist and the n8n help alert. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Repository map

```
docs/            spec, architecture, design, roadmap, research, per-person tasks
public/          ASL landmark data, reference charts, self-hosted wasm and models (generated)
scripts/         asset setup
src/app/         routes: landing (/), workspace (/app), API (/api/speak)
src/components/  camera panel, hold ring, sentence strip, captions, practice, landing UI
src/engine/      camera, MediaPipe, hand tracker, stabilizer, ASL classifiers, custom gestures
src/voice/       text-to-speech hook with audio cache
src/lib/         shared contracts, starter phrases, storage, flags, utils
src/tests/       unit tests
```

## Team lanes

| Lane | Owns | Task file |
|---|---|---|
| P1 Engine | `src/engine/*`, `CameraPanel`, `HoldRing` | [docs/tasks/P1-engine.md](docs/tasks/P1-engine.md) |
| P2 Voice/API | `src/app/api/*`, `src/voice/*` | [docs/tasks/P2-voice-api.md](docs/tasks/P2-voice-api.md) |
| P3 UI/Design | `page.tsx`, `layout.tsx`, `globals.css`, components, storage | [docs/tasks/P3-ui.md](docs/tasks/P3-ui.md) |
| P4 Base/Ship | docs, scripts, deploy, demo, submission | [docs/tasks/P4-ship.md](docs/tasks/P4-ship.md) |

## Docs

- [docs/SPEC.md](docs/SPEC.md): the original concept and full spec
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): stack and extension points
- [docs/DESIGN.md](docs/DESIGN.md): design system and motion
- [docs/ROADMAP.md](docs/ROADMAP.md): tiers, feature slices, timeline
- [docs/RESEARCH.md](docs/RESEARCH.md): research notes
- [docs/GIST_PROMPT.md](docs/GIST_PROMPT.md): the planned Gemini prompt
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md): lanes, git rules, definition of done
- [docs/tasks/](docs/tasks/): task files per person

## Limits and honesty

- AirSign is **not** an interpreter and does **not** translate full sign language. ASL has grammar, facial expression, movement and context that AirSign does not understand.
- The ASL modes recognize **static letters, numbers 0–10, and isolated words**. They are a learning and practice aid, not a replacement for a teacher or the Deaf community. Letters that need motion (J, Z) are not recognized.
- **Quick phrases and two-hand combos are not ASL.** They are simple gestures we mapped to phrases, and the UI labels them that way.
- Recognition makes mistakes, especially in poor lighting or at odd angles. AirSign always shows its guess and confidence, and nothing is spoken until you confirm.
- The honest next step is co-design with Deaf users and ASL teachers.
- We do not invent statistics or user quotes, and we do not claim more accessibility testing than we actually did.
- Model licences: the pretrained alphabet model is CC BY-NC 4.0 (non-commercial use only).
