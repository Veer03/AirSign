import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 500;

const speakSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT),
  voice: z.enum(["warm", "calm", "energetic"]),
});

const DEFAULT_VOICE_IDS = {
  warm: "21m00Tcm4TlvDq8ikWAM",
  calm: "EXAVITQu4vr4xnSDxMaL",
  energetic: "pNInz6obpgDQGcFmaJgB",
} as const;

const ENV_VOICE_IDS = {
  warm: process.env.ELEVENLABS_VOICE_WARM,
  calm: process.env.ELEVENLABS_VOICE_CALM,
  energetic: process.env.ELEVENLABS_VOICE_ENERGETIC,
} as const;

/**
 * flash_v2_5 is multilingual and auto-detects the language, which goes wrong
 * on short inputs ("A", "Stop", "Yes") and gives odd accents. Always English.
 */
const LANGUAGE_CODE = "en";

function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET() {
  const configured = Boolean(process.env.ELEVENLABS_API_KEY);
  return NextResponse.json({ configured, model: "eleven_flash_v2_5" });
}

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return error(
      "not_configured",
      "Add ELEVENLABS_API_KEY to .env.local and restart the dev server to enable the voice.",
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("bad_request", "Expected a JSON body.", 400);
  }

  const parsed = speakSchema.safeParse(body);
  if (!parsed.success) {
    return error("bad_request", `Text must be 1–${MAX_TEXT} characters and voice must be warm, calm, or energetic.`, 400);
  }

  const voiceId = ENV_VOICE_IDS[parsed.data.voice] || DEFAULT_VOICE_IDS[parsed.data.voice];
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: "eleven_flash_v2_5",
        language_code: LANGUAGE_CODE,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "TimeoutError") {
      return error("timeout", "The voice service timed out. Try again.", 504);
    }
    return error("upstream_unreachable", "Could not reach the voice service.", 502);
  }

  if (!upstream.ok) {
    if (upstream.status === 401 || upstream.status === 403) {
      return error("unauthorized", "ElevenLabs rejected the API key. Check .env.local.", 502);
    }
    if (upstream.status === 429) {
      return error("rate_limited", "The voice service is rate limited. Wait a moment.", 429);
    }
    // Do not forward provider bodies: they can contain request details.
    return error("upstream_error", `The voice service returned ${upstream.status}.`, 502);
  }

  const audio = await upstream.arrayBuffer();
  if (audio.byteLength === 0) {
    return error("empty_audio", "The voice service returned no audio.", 502);
  }

  return new NextResponse(audio, {
    status: 200,
    headers: {
      "content-type": "audio/mpeg",
      "content-length": String(audio.byteLength),
      "cache-control": "private, max-age=86400",
    },
  });
}
