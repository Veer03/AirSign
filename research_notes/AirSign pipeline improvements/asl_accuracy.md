# ASL recognition quality and safe optimization

## What the current training data can and cannot promise

### Takeaway
The Kaggle/PopSign 250-class model is a useful isolated-sign baseline, but its published scores do not predict AirSign’s camera accuracy. The strongest first move is a consented, signer-held-out evaluation set that matches AirSign’s capture path; avoid changing temporal input or confidence cutoffs before that baseline exists.

### Cited Findings
- The Google Isolated Sign Language Recognition challenge targets 250 isolated ASL signs and provides processed landmark data for PopSign’s educational application. [Kaggle competition data page](https://www.kaggle.com/c/asl-signs/data)
- PopSign ASL v1.0 reports 47 consenting Deaf adult signers, Pixel 4A selfie-camera recordings, 31/8/8 signer-level train/validation/test splits, and a baseline LSTM score of 82.1% validation accuracy and 84.2% test accuracy. These are results for the paper’s baseline and dataset protocol, not measurements of AirSign’s ONNX artifact or live camera pipeline. [PopSign ASL v1.0 paper](https://papers.nips.cc/paper_files/paper/2023/file/00dada608b8db212ea7d9d92b24c68de-Paper-Datasets_and_Benchmarks.pdf)
- The PopSign paper reports that about 39,000 reviewed samples were recognizable signs but not the intended variant or were another sign; it discusses regional, cultural, and household variation and explicitly says the dataset does not represent ASL broadly. [PopSign ASL v1.0 paper](https://papers.nips.cc/paper_files/paper/2023/file/00dada608b8db212ea7d9d92b24c68de-Paper-Datasets_and_Benchmarks.pdf)
- ASL Citizen is a separate community-sourced dataset with 83,399 videos, 2,731 signs, and 52 signers; its paper reports 63% top-1 accuracy and 91% recall-at-10 on test users excluded from train and validation. This is a different task, vocabulary, and model, so the score is not directly comparable to PopSign. [ASL Citizen paper](https://arxiv.org/abs/2304.05934)
- AirSign’s installed ONNX is the 250-class Kaggle model converted for browser use; the runtime receives dynamic-length `[T,543,3]` data, then returns a softmax top-three list. The exact inference artifact and test performance are not established by the paper’s baseline score. [AirSign setup script](../../scripts/setup-assets.mjs), [AirSign classifier](../../src/engine/asl-classifier.ts)

### Inferences
- AirSign should describe this as an isolated 250-label guesser, not ASL translation. The chosen data is intentionally a constrained teaching vocabulary and one intended variant per concept.
- Changes that improve a public benchmark can still worsen the current live pipeline if they alter landmark extraction, coordinate orientation, temporal sampling, or missing-landmark handling. Keep the downloaded ONNX artifact and current preprocessing as the baseline while evaluating such changes.

### Gaps
- No live, signer-disjoint accuracy result for AirSign’s model, MediaPipe version, camera constraints, or current acceptance rule was found in the repository.
- It is not confirmed whether the shipped ONNX weights are exactly the paper baseline or which benchmark metrics the upstream Kaggle winning model achieved; do not attribute those scores to the shipped model without checking its training/export provenance.

## What to measure before tuning accuracy

### Takeaway
Build a small, consented held-out clip set and score both correct recognition and harmful false emissions. Use unseen signers and no-sign / transition / out-of-vocabulary clips; tune the current top-two evidence rule and softmax thresholds on validation data only.

### Cited Findings
- ASL Citizen evaluates on users absent from train and validation, and distinguishes top-1 accuracy from retrieval recall-at-10. This supports reporting signer-held-out results and more than one metric, rather than a random frame split. [ASL Citizen paper](https://arxiv.org/abs/2304.05934)
- PopSign’s paper uses signer-disjoint train, validation, and test groups and notes variation by signer and intended sign variant. [PopSign ASL v1.0 paper](https://papers.nips.cc/paper_files/paper/2023/file/00dada608b8db212ea7d9d92b24c68de-Paper-Datasets_and_Benchmarks.pdf)
- Neural-network softmax probabilities are not necessarily calibrated estimates of correctness; temperature scaling is a post-hoc method shown to improve calibration on held-out data without changing class ranking. [Guo et al., “On Calibration of Modern Neural Networks”](https://proceedings.mlr.press/v70/guo17a.html)
- AirSign currently takes the top-three softmax classes, and a word can be admitted when it appears in the top two of at least two recent inferences with minimum average and peak probabilities. Those thresholds are source constants, not values shown to be calibrated against signer-held-out AirSign footage. [AirSign classifier](../../src/engine/asl-classifier.ts), [AirSign word pipeline](../../src/engine/useAslWords.ts)

### Inferences
- Recommended baseline dataset: record or collect consented short clips from multiple signers, split strictly by signer, and include several camera distances, left/right hand use, lighting, and backgrounds. Keep the same clips and software build for before/after comparison.
- Report top-1 accuracy, macro-F1, per-class confusion, top-3 recall, “no sign” false-trigger rate, unknown-sign rejection rate, and p50/p95 time-to-emission. For an assistive communication UI, false phrases per minute and false acceptance on OOV/no-sign clips are as important as raw top-1 accuracy.
- Add a “no decision” outcome for uncertain/OOV/transition input and select its cutoff using a held-out validation set. Calibration or threshold adjustment should not be inferred from probabilities on training clips.
- The current 250 ms inference cadence means successive 1.5-second windows overlap heavily; top-two support across them is useful temporal smoothing but is not independent confirmation. Measure false accepts on long held poses and transition clips before making this rule stricter or looser.

### Gaps
- No licensed, downloadable evaluation subset matched to AirSign’s current exact 250-class label map and consenting signer demographics was confirmed. Check data/model licenses and consent terms before collecting, storing, or redistributing clips.
- The project has no benchmark labels or performance targets for first-token latency, false-trigger rate, or signer-held-out accuracy yet.

## Which speed improvements are lowest risk

### Takeaway
Measure first, then prioritize responsiveness-preserving changes: move WASM inference into ONNX Runtime’s proxy worker, and test browser-supported WASM threads. Do not switch this dynamic-time model back to WebGPU or change frame sampling until the current model is covered by accuracy and latency benchmarks.

### Cited Findings
- ONNX Runtime Web documents `env.wasm.proxy` as moving compute into a Web Worker to prevent UI blocking; it improves responsiveness, not raw inference speed, and has CSP limitations. [ONNX Runtime Web environment flags](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html)
- ONNX Runtime Web says WASM multithreading is disabled by `numThreads: 1`; a thread count of 0 allows automatic sizing, and multi-threading is enabled only where WebAssembly threads and cross-origin isolation are supported. Its performance guide recommends testing multithreading for WASM workloads. [Environment flags and session options](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html), [Performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html)
- A separate project using this same Kaggle 250-sign model and ONNX Runtime Web 1.20.1 reports that WebGPU was dramatically slower for its dynamic-time-dimension model, and caps inputs at 48 frames. This is a project-specific empirical report rather than a general WebGPU rule, but it strongly supports retaining the WASM backend and benchmarking before switching providers. [Signchat architecture](https://github.com/nlevites/signchat/blob/main/ARCHITECTURE.md)
- ONNX Runtime’s performance guide describes profiling session execution and comparing provider/settings behavior. AirSign’s existing `?debugAsl=1` timer begins after tensor construction, so it omits frame stacking and tensor setup. [ONNX Runtime performance diagnosis](https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html), [AirSign classifier](../../src/engine/asl-classifier.ts)

### Inferences
- First capture end-to-end timing for camera-frame detection, landmark packing, ONNX tensor packing, model execution, and candidate confirmation; log p50/p95 over several minutes on at least one low-end and one typical device. Keep debug logging sampled so it does not become the bottleneck.
- Test ONNX proxy-worker mode first as a UI-smoothness experiment: it should preserve model weights, input, and decision rule, although worker loading/CSP and runtime wiring must be validated in the Next.js deployment.
- Test `numThreads: 0` or a small thread count only after serving the required COOP/COEP isolation headers and verifying browser support. Benchmark against the current one-thread configuration because MediaPipe and ORT competing for CPU cores can erase gains.
- The related implementation’s `T ≤ 48` is a useful test point, not a safe production limit. AirSign’s 1.5-second window at 35–40 fps can contain roughly 52–60 frames. Compare full input against uniform temporal sampling to 48 and 32 using the same held-out clips; only ship a sample count that improves latency without meaningful metric regression.
- If Holistic, rather than ONNX, dominates timing, worker-based camera processing or reducing inference cadence may improve responsiveness, but both need live-camera accuracy and missed-sign checks. Keep full face/pose/hand landmarks because the current classifier consumes them.

### Gaps
- No browser/device profiling was available during this research, so the dominant measured stage and actual expected speedup remain unknown.
- The signchat timing and frame limit are maintainer-reported implementation choices, not a benchmark over AirSign hardware or proof that 48 frames preserves AirSign accuracy.
