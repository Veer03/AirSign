export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is unavailable. Open AirSign on localhost or HTTPS.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
  });

  video.srcObject = stream;
  try {
    await video.play();
    return stream;
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    throw error;
  }
}

export function stopCamera(video: HTMLVideoElement | null, stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
  if (video) video.srcObject = null;
}

export function cameraErrorMessage(error: unknown): { message: string; denied: boolean } {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return {
      message: "Camera permission was blocked. Allow camera access in your browser, then try again.",
      denied: true,
    };
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return { message: "No camera was found. Connect a camera or use the typed demo capture.", denied: false };
  }
  if (error instanceof DOMException && error.name === "NotReadableError") {
    return { message: "The camera is busy in another app. Close that app and try again.", denied: false };
  }
  return {
    message: error instanceof Error ? error.message : "Could not start the camera. Try again or use the typed demo capture.",
    denied: false,
  };
}
