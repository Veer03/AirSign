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
  // getUserMedia is unavailable on plain HTTP (except localhost). Report that
  // directly instead of mislabeling it as a blocked permission.
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      kind: "insecure",
      message: "Camera needs HTTPS or localhost in this browser. Keyboard keys 1–9 still work.",
    };
  }

  const name =
    error instanceof DOMException
      ? error.name
      : ((error as { name?: string } | null)?.name ?? "");

  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return {
        kind: "denied",
        message:
          "Camera permission was blocked. Allow camera access in the browser, then try again. Keyboard keys 1–9 still work.",
      };
    case "NotFoundError":
    case "OverconstrainedError":
      return {
        kind: "not-found",
        message: "No camera found. Plug one in, or use keyboard keys 1–9 for the demo.",
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
            : "The camera could not start. Keyboard keys 1–9 still work.",
      };
  }
}

export type CameraFacing = "user" | "environment";

export async function startCamera(
  video: HTMLVideoElement,
  isCancelled: () => boolean = () => false,
  // Hand tracking does not need a 720p stream; 640×480 cuts per-frame work
  // while keeping hands detailed enough for landmark recognition.
  size: { width: number; height: number } = { width: 640, height: 480 },
  /** "user" = front/selfie camera, "environment" = rear camera (mobile). */
  facing: CameraFacing = "user",
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
      // Keep the source at the tracker’s useful working size on phones. An
      // ideal-only request can still return full sensor resolution on mobile.
      facingMode: { ideal: facing },
      width: { ideal: size.width, max: size.width },
      height: { ideal: size.height, max: size.height },
      // Request smooth 30–40 fps capture where the camera supports it.
      frameRate: { ideal: 35, max: 40 },
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
