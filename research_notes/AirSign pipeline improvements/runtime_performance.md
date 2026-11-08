# Runtime performance

## How should runtime performance be improved without risking recognition?

### Takeaway
Measure stage costs first, then try two distinct changes: enable ONNX Runtime's WASM proxy worker for smoother UI, and test automatic WASM threading only where cross-origin isolation is available. Neither requires changing ASL inputs or decision thresholds. The user's report that WebGPU regressed this model is consistent with ONNX Runtime's warning that partial operator placement and CPU fallback can make GPU execution slower; do not switch this model back without an A/B test.

### Cited Findings
- ONNX Runtime Web explicitly says the WASM proxy worker improves UI responsiveness by moving heavy compute off the main thread, but does not improve model inference performance itself. It is disabled by default. — [ONNX Runtime performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html)
- Proxy mode cannot be combined with the proxy-worker WebGPU path and may be blocked by CSP because it creates a Worker from a Blob. — [ONNX Runtime environment flags](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html)
- WASM multithreading is supported only when the browser has WebAssembly threads and the page is cross-origin isolated. `numThreads = 1` forces it off; the default `0` chooses a count based on hardware, subject to feature availability. — [ONNX Runtime environment flags](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html), [WASM API reference](https://onnxruntime.ai/docs/api/js/interfaces/Env.WebAssemblyFlags.html)
- Cross-origin isolation requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`; the latter can block third-party assets without CORS/CORP opt-in. The browser exposes `crossOriginIsolated` for verification. — [web.dev cross-origin isolation guide](https://web.dev/articles/coop-coep)
- ONNX Runtime recommends enabling multithreading when supported, and its docs say it can improve performance by using more CPU cores. The same guide recommends uint8 rather than float16 for CPU quantized models. — [ONNX Runtime performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html)
- ONNX Runtime's WebGPU docs say WebGPU is intended for compute-intensive models; graph capture requires static input shapes and all operators running on WebGPU, and may fail otherwise. ONNX troubleshooting notes CPU fallback can reduce GPU performance. — [Using WebGPU](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html), [ONNX Runtime troubleshooting](https://onnxruntime.ai/docs/performance/tune-performance/troubleshooting.html)
- **Code observation:** AirSign pins `numThreads = 1`, and `next.config.ts` currently has no COOP/COEP headers. `public/ort` already contains the threaded SIMD WASM artifact, but presence of the artifact alone does not enable threading.
- **Code observation:** ASL Words currently uses a variable-length 1.5-second window and sends about 50–60 frames per inference at 35–40 fps. `stackFrames()` and tensor creation happen before the existing `debugAsl=1` timer starts, so that log measures `session.run()` only, not input assembly or total classification latency.
- **Code observation:** The current WebGPU attempt was reverted after the user observed slower and less accurate ASL Words guesses. This empirical result is stronger than a generic expectation that GPU is faster for this model.

### Inferences
- First add low-overhead stage measurements (Holistic detection, landmark serialization, stack/tensor creation, `session.run`, and end-to-end infer interval) and compare p50/p95 on a fixed set of devices. Existing `?debugAsl=1` is useful but understates total classifier time because it starts timing after tensor construction. ONNX Runtime provides CPU profiling and trace facilities, though profiling should be an opt-in diagnostic because it adds work. — [ONNX Runtime performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html)
- Try `ort.env.wasm.proxy = true` as a responsiveness experiment while keeping the exact same classifier/model, then verify worker asset loading under the app's real CSP and hosting. Expect less UI blocking, not a faster model result.
- Separately test `numThreads = 0` behind a feature check, only after verifying `crossOriginIsolated` on local and deployed hosts. First use COEP report-only and inspect blocked resources; then consider enforcement. Keep single-thread fallback for non-isolated or incompatible browsers.
- Keep ASL input frame count, ordering, NaN layout, thresholds, and WASM provider fixed while testing worker/thread options; that isolates performance change from recognition change.
- Do not tune WebGPU graph capture yet: the input T dimension changes with frame rate and each 1.5-second window, while graph capture is documented for fixed shapes/all-WebGPU workloads. Revisit only after the model is validated on WebGPU and the input is made static without changing semantics.
- A quantized model may reduce CPU cost and download size, but it changes numerical outputs/confidence. Treat it as a separate model-quality experiment with a labeled test set, not a safe optimization.

### Gaps
- No benchmark on AirSign's actual browsers/devices is available, so it is unknown whether Holistic, WASM inference, JavaScript tensor assembly, or thermal throttling dominates in practice.
- The ONNX model's node-to-provider placement and per-node timings have not been captured; the prior WebGPU regression cannot be attributed specifically to CPU fallback, transfer overhead, or driver behavior.
- The 1.5-second input and 50–60 frame cadence have not been compared against the model's training/inference preprocessing. Do not reduce or resample frames on performance evidence alone.

## Should expensive vision work move off the main thread?

### Takeaway
Yes, off-main-thread execution is the highest-potential route to a smoother interface, especially for MediaPipe's per-frame tracking. Google explicitly states Web Gesture Recognizer's synchronous video inference blocks the UI thread and recommends Web Workers; ONNX Runtime's built-in WASM proxy worker is a lower-effort first step, though it only improves responsiveness.

### Cited Findings
- MediaPipe's Web Gesture Recognizer guide states that `recognize()` and `recognizeForVideo()` run synchronously and block the UI thread; it recommends implementing Web Workers for camera video. — [MediaPipe Gesture Recognizer for Web](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/web_js)
- MediaPipe's browser input guidance lists browser image-source types that tasks can consume directly, avoiding an extra wrapper/copy where supported. — [MediaPipe prepare input data](https://developers.google.com/edge/mediapipe/solutions/prepare_data)
- ONNX Runtime's proxy worker can offload WASM computation from the main thread; it improves UI responsiveness rather than model throughput. — [ONNX Runtime performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html)
- **Local SDK observation:** Installed `@mediapipe/tasks-vision` 1.2.2 declarations expose a `HolisticLandmarker.detectForVideo` callback overload, but its comments say the method returns synchronously once the callback returns; this is not an asynchronous inference API.

### Inferences
- A dedicated worker for Holistic is the largest likely UI-smoothness improvement because this app runs Holistic once for every camera frame. The worker needs ownership of the task instance, transferable frame input (for example `ImageBitmap` where supported), throttled result messages, and clean teardown. This is a substantial pipeline change and should be benchmarked for copy cost, hand-overlay lag, stale frames, and timestamp monotonicity.
- Start with ORT's proxy worker before moving MediaPipe. It is less invasive and keeps the current model input and scores unchanged; if the UI still stalls, then build a MediaPipe worker proof-of-concept.
- Never queue every video frame in a worker. Use a latest-frame/drop-when-busy policy so inference does not accumulate stale work; preserve monotonically increasing timestamps as MediaPipe requires.

### Gaps
- We found explicit official Worker guidance for Gesture Recognizer, but not a HolisticLandmarker web-worker sample covering this exact model and package version. Validate worker support in the pinned `@mediapipe/tasks-vision` version before restructuring.
- No measurement currently shows how much time `detectHolistic()` consumes on the target device or how much `ImageBitmap` transfer adds.

## How should the ONNX model and React UI be diagnosed?

### Takeaway
Add a repeatable benchmark and profile the full user-visible path, not just `session.run()`. Preserve the recognition result while measuring model loading, preprocessing, inference, React commits, dropped frames, and end-to-end latency.

### Cited Findings
- ONNX Runtime Web supports `enableProfiling` and `endProfiling()` for CPU inference profiling; it also supports trace timestamps that can be inspected in browser performance tooling. — [ONNX Runtime performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html)
- ONNX Runtime recommends right-sizing the model for web devices; larger/complex models can increase download time, inference delay, and memory consumption. — [ONNX Runtime performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html)
- ONNX Runtime's deployment guidance says models can be cached with IndexedDB or Cache API to avoid repeated downloads, and smaller artifacts reduce load time and client memory. — [Deploying ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/deploy.html)
- React's `<Profiler>` reports render `actualDuration` and `baseDuration`; profiling adds overhead and is disabled in production builds by default. — [React Profiler reference](https://react.dev/reference/react/Profiler)

### Inferences
- For each run, record both input T and timings for: Holistic, `frameTo543`, buffer trim/stack, tensor construction, ORT `session.run`, and completion-to-display. Compare p50 and p95 over repeated runs, because one fast result can hide stalls.
- Create a fixed, consented clip set with known labels and run it unchanged across candidate runtime options. Track top-1 accuracy, top-3 recall, false locks, time-to-first-guess, and end-to-end UI responsiveness; do not compare speed if input landmarks or preprocessing differ.
- Use cold-cache and warm-cache measurements separately. Model initialization and a roughly 22 MB model download affect first-use latency but not steady-state inference. AirSign already has audio caching; check whether model fetching is browser-cached and add explicit persistent caching only if cold starts remain a concern.
- React Profiler is probably a secondary optimization now: the hook skips unchanged published values, while the dominant per-frame synchronous tracking/inference path is a more plausible source of visual stalls. Confirm with React Profiler and browser Performance panel before adding broad memoization.

### Gaps
- No existing labeled cross-signer clip set or production-device benchmark report was found. Accuracy-preserving speedups therefore require creating a small held-out evaluation set before changing frame selection, model precision, delegates, or thresholds.
- The project has not measured cold model load time, cache-hit behavior, or React commit duration on mobile hardware.
