# MediaPipe pipeline performance

## What is likely costing time, and how to measure it

### Takeaway
The biggest responsiveness risk is synchronous per-frame MediaPipe work on the UI thread. The safer first move is stage-by-stage timing and trace capture; no speed estimate should be treated as measured from this source scan.

### Cited Findings
- In this repository, `useAslWords` invokes `detectHolistic(...)` from a video-frame callback and `detectHolistic` directly calls `landmarker.detectForVideo(video, timestamp)`. The starter path similarly calls `recognizeForVideo` from its frame loop. These are synchronous code paths in this app (source: `src/engine/useAslWords.ts`, `src/engine/holistic.ts`, `src/engine/useGestures.ts`).
- The official MediaPipe JS Holistic implementation documents `detectForVideo` as synchronous through the callback and has a synchronous return-value overload. The callback overload keeps results valid only during callback execution; the return-value overload copies masks to extend their lifetime and is specifically cautioned against for high-throughput applications. AirSign disables pose segmentation masks and face blendshapes, so the mask-copy warning may not explain this app’s cost; confirm against the installed 1.2.2 package before changing the API. [Official HolisticLandmarker implementation](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/web/vision/holistic_landmarker/holistic_landmarker.ts)
- The Holistic graph combines pose, face, and hand landmarkers; the classic Holistic documentation describes 543 points per frame (468 face, 33 pose, 21 per hand) and tracking after initial detection. AirSign’s model input uses the corresponding face/pose/both-hands layout, so dropping face or pose output is not a safe optimization without retraining or validating the classifier. [MediaPipe Holistic documentation](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/holistic.md)
- The current MediaPipe official web samples include a `HolisticLandmarker` module worker that initializes Tasks Vision and runs `detectForVideo` on transferred frame bitmaps. The sample repository currently depends on `@mediapipe/tasks-vision` `^1.2.2`, matching AirSign’s installed version family. [Official Holistic worker](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/holistic-landmarker.worker.ts), [official sample package versions](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/package.json)
- Google’s sample worker reports its own inference duration with `performance.now()`, illustrating a direct way to separate task time from page-side work. [Official Holistic worker](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/holistic-landmarker.worker.ts)

### Inferences
- Add low-overhead timing around: frame callback cadence; `detectHolistic`; `frameTo543`; tensor assembly; ONNX session `run`; and time from inference completion to UI publication. Log rolling p50/p95 once per few seconds rather than per frame. This will distinguish tracking saturation from classifier latency and React/UI delay.
- AirSign’s current ASL classifier debug timer starts after tensor construction, so it reports ONNX `session.run` duration but excludes `stackFrames` and tensor creation (`src/engine/asl-classifier.ts`). Capture both preparation and session time before deciding whether to optimize buffering or model execution.
- The camera requests 35 fps ideal / 40 fps max and ASL Words stores up to the latest 1.5 seconds, so frame-window length varies with actual camera cadence. The model input shape is dynamic `[T,543,3]`; higher capture cadence can mean more data per inference, not automatically faster guesses (`src/engine/camera.ts`, `src/engine/useAslWords.ts`, `src/engine/asl-classifier.ts`). Preserve the current capture request, but measure actual `T` and latency by device.

### Gaps
- No device/browser timings, camera clips, or accuracy benchmark were available for this scan. The relative time spent in Holistic, packing, and ONNX remains unmeasured.
- The implementation’s type declarations for Holistic’s callback overload should be checked in the exact installed `@mediapipe/tasks-vision@1.2.2` package before using it; the repository’s live GitHub source can move ahead of a pinned dependency.

## Which MediaPipe changes look promising and safe

### Takeaway
A worker is now a practical, source-backed route to smoother UI and is the highest-priority experiment. It should be framed as a responsiveness improvement, not presumed to reduce inference time or improve recognition accuracy.

### Cited Findings
- The first-party MediaPipe web samples now demonstrate a module worker for HolisticLandmarker; the worker handles initialization and video frames and posts results back to the main thread. [Official Holistic worker](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/holistic-landmarker.worker.ts), [official base-worker implementation](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/base-worker.ts)
- The official sample’s worker protocol serializes processing (`isProcessing`) and posts a result for each submitted frame in the shown Holistic implementation; AirSign would still need back-pressure/latest-frame behavior to prevent a queue from increasing latency if processing is slower than camera capture. [Official base-worker implementation](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/base-worker.ts)
- MediaPipe’s official worker sample performs GPU initialization diagnostics and CPU fallback, including checks for unsupported OffscreenCanvas/WebGL and software rendering. This supports keeping AirSign’s existing GPU/CPU fallback and measuring both delegates on target devices instead of assuming GPU is always faster. [Official base-worker implementation](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/base-worker.ts)
- MediaPipe’s official Holistic JS interface accepts either a path or model buffer. The official worker loads a model buffer before task initialization, which is relevant to adapting AirSign’s self-hosted model assets and offline delivery. [HolisticLandmarker implementation](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/web/vision/holistic_landmarker/holistic_landmarker.ts), [official Holistic worker](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/holistic-landmarker.worker.ts)

### Inferences
- Prototype a dedicated worker only for the ASL Words Holistic task first. Send `ImageBitmap` or another transferable frame with its timestamp; close every transferred frame in the worker; allow at most one in-flight frame and replace any queued frame with the newest one. This avoids backlog and keeps rendering/input responsive while preserving the same model, options, and captured frames.
- Keep worker fallback to the current main-thread implementation for browsers where module workers, OffscreenCanvas, or delegate setup fails. The official first-party sample proves current API viability in its own app, but does not establish identical support across all AirSign target browsers.
- Compare CPU and GPU on the same recorded camera clips, same model bytes, and same task options. Use both task latency and end-to-end UI responsiveness; do not assume the GPU delegate will improve every device.
- Do not remove face/pose, alter thresholds, downsample camera capture, or reduce model input sequence length in the first worker experiment. Those changes can affect predictions and confound the performance result.

### Gaps
- The official sample demonstrates worker operation but does not publish an AirSign-specific speedup, accuracy comparison, memory profile, or cross-browser support matrix for this task.
- A fully async MediaPipe live-stream integration could avoid blocking calls, but exact JavaScript overload behavior, dropped-frame policy, and timestamp handling should be verified against installed v1.2.2. No measured benefit was found for simply switching from the current VIDEO call.

## Recommended implementation and validation order

### Takeaway
Measure first, then implement the worker as a responsiveness-only change with unchanged model inputs. Consider sampling/quantization or model replacement only as separately evaluated accuracy experiments.

### Cited Findings
- MediaPipe’s public documentation distinguishes synchronous video inference from live-stream operation and notes that live-stream inference returns results through a callback; the live-stream API may drop frames to reduce latency rather than guaranteeing a result for every frame. The current repository uses VIDEO mode with a synchronous `detectForVideo` call (`src/engine/holistic.ts`). [HolisticLandmarker API](https://ai.google.dev/edge/api/mediapipe/python/mp/tasks/vision/HolisticLandmarker)
- The web version’s first-party worker sample already demonstrates a measured worker-based route for Holistic, making that a more concrete experiment than speculative tuning of thresholds or removing landmarks. [Official Holistic worker](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/holistic-landmarker.worker.ts)
- The current 1.5-second window and 250 ms inference cadence are application choices, not fixed MediaPipe requirements (`src/engine/useAslWords.ts`). Changing them affects temporal context and candidate confirmation, so such tuning needs a held-out clip set rather than FPS alone.

### Inferences
- Suggested sequence: (1) collect baseline p50/p95 for Holistic, frame packing, tensor assembly, ONNX, and UI frame delay on one low-end phone, one typical laptop, and one high-end machine; (2) worker-prototype with unchanged task/model/input; (3) check prediction equivalence on a fixed clip suite and report dropped frame counts; (4) only then investigate bounded uniform temporal sampling or a smaller/quantized model as separate experiments.
- To assess accuracy, record consented, varied clips for the app’s supported vocabulary and compare top-1/top-3 accuracy, false locks, abstentions, and time-to-guess before/after. A lower latency with more false guesses should not be counted as an improvement.
- A frame budget can be tuned without lowering camera capture rate: preserve full camera capture for preview, but if measurements prove the model cannot use every frame, test latest-frame delivery / fixed-length model sampling against the clip suite. That remains an accuracy-sensitive hypothesis until measured.

### Gaps
- There is no available validated ground-truth clip corpus or end-to-end browser/device performance suite in the repository, so performance and accuracy claims need new baseline data.
- This scan does not establish whether changing to MediaPipe live-stream mode is faster or more accurate than current VIDEO mode for AirSign’s application.
