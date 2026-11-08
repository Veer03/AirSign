"use client";

export type CameraErrorKind = "denied" | "not-found" | "busy" | "insecure" | "error";

export type CameraError = {
  kind: CameraErrorKind;
  message: string;
};

export type CameraHandle = {
  stream: MediaStream;
  stop: () => void;
};

export function describeCameraError(error: unknown): CameraError {
  const name = error instanceof DOMException ? error.name : "";

  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return {
        kind: "denied",
        message:
          "Camera permission was blocked. Allow camera access in the browser, then try again. Keyboard keys 1–7 still work.",
      };
    case "NotFoundError":
    case "OverconstrainedError":
      return {
        kind: "not-found",
        message: "No camera found. Plug one in, or use keyboard keys 1–7 for the demo.",
      };
    case "NotReadableError":
    case "AbortError":
      return {
        kind: "busy",
        message: "The camera is in use by another app. Close it and try again.",
      };
    default:
      return {
        kind: "error",
        message:
          error instanceof Error
            ? `Camera error: ${error.message}`
            : "The camera could not start. Keyboard keys 1–7 still work.",
      };
  }
}

export async function startCamera(
  video: HTMLVideoElement,
  isCancelled: () => boolean = () => false,
): Promise<CameraHandle> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException(
      "Camera needs HTTPS or localhost in this browser.",
      "NotAllowedError",
    );
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 60 },
    },
  });

  // React StrictMode mounts effects twice in dev. If this request was
  // superseded while the permission prompt was open, release the stream
  // instead of overwriting the newer one on the shared <video> element.
  if (isCancelled()) {
    stream.getTracks().forEach((track) => track.stop());
    throw new DOMException("Camera start cancelled", "AbortError");
  }

  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;

  await video.play();

  if (!video.videoWidth) {
    await new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener("loadedmetadata", done);
        resolve();
      };
      video.addEventListener("loadedmetadata", done);
    });
  }

  return {
    stream,
    stop() {
      stream.getTracks().forEach((track) => track.stop());
      if (video.srcObject === stream) video.srcObject = null;
    },
  };
}
