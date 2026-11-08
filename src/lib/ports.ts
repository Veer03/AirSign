/**
 * The single swap point for real modules.
 *
 * The camera now uses P1's local MediaPipe implementation. Speech and
 * captions remain typed mocks until P2 lands. The camera asks permission only
 * after the user presses Start camera.
 *
 * export { useSpeak } from "@/voice/use-speak";
 * export { useCaptions } from "@/voice/use-captions";
 */

export { SignCamera } from "@/components/engine/sign-camera";
export { useSpeak } from "@/components/mocks/use-speak";
export { useCaptions } from "@/components/mocks/use-captions";
