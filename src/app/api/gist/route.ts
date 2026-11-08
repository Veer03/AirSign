import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiError, GistResponse } from "@/lib/contracts";
import { getContext } from "@/lib/contexts";
import { fallbackGist } from "@/lib/gist";

export const maxDuration = 10;

const candidateSchema = z.object({
  label: z.string().min(1).max(48),
  confidence: z.number().min(0).max(1),
});

const captureSchema = z.object({
  context: z.enum(["pharmacy", "restaurant", "transit", "frontdesk", "general"]),
  frames: z.number().int().min(0).max(600),
  durationMs: z.number().int().min(0).max(10_000),
  candidates: z.array(candidateSchema).max(8),
  summary: z.array(z.number()).max(256).optional(),
});

const requestSchema = z.object({
  context: z.enum(["pharmacy", "restaurant", "transit", "frontdesk", "general"]),
  capture: captureSchema,
});

const responseSchema = z.object({
  gist: z.string().min(1).max(200),
  uncertain: z.boolean(),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.string().min(1).max(80)).max(3),
  note: z.string().min(1).max(200),
});

const SYSTEM_INSTRUCTION = `You are a communication aid between a person who is signing and a hearing person who does not sign.

You receive a context label, a short capture of hand-landmark data, and coarse gesture/sign candidates with confidence scores.

Write ONE short, polite, first-person sentence that captures the most likely gist of what the person wants to say in this context.

Rules:
- Use only the candidates and the context. Never invent facts, names, numbers, medical details, prices, or promises.
- Prefer simple, everyday wording. One sentence. Under 18 words.
- If the candidates conflict or the top confidence is below 0.6, set uncertain=true, lower the confidence, and list the plausible alternatives.
- If the capture is empty or unusable, return a neutral request to try again, with uncertain=true.
- Never say or imply that you translated sign language. You are framing a gist.
- Output JSON only. No markdown.`;

function error(code: string, message: string, status: number) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status });
}

async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("invalid_json", "Request body must be JSON.", 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return error(
      "invalid_request",
      "Expected { context, capture } with at most 8 candidates.",
      422,
    );
  }

  const { context, capture } = parsed.data;
  const fallback = fallbackGist(capture);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json<GistResponse>({
      ...fallback,
      note: "Gemini is not configured. This is a local reading — please confirm or type instead.",
    });
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  const contextHint = getContext(context).promptHint;

  const userPayload = {
    context,
    contextHint,
    capture: {
      frames: capture.frames,
      durationMs: capture.durationMs,
      candidates: capture.candidates,
      summary: capture.summary ?? [],
    },
  };

  try {
    const ai = new GoogleGenAI({ apiKey });

    const work = ai.models
      .generateContent({
        model,
        contents: JSON.stringify(userPayload),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
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
            required: [
              "gist",
              "uncertain",
              "confidence",
              "alternatives",
              "note",
            ],
          },
        },
      })
      .then((response) => response.text);

    const text = await withTimeout(work, 5000);
    if (!text) return NextResponse.json<GistResponse>(fallback);

    const parsedResponse = responseSchema.safeParse(JSON.parse(text));
    if (!parsedResponse.success) {
      return NextResponse.json<GistResponse>(fallback);
    }

    return NextResponse.json<GistResponse>(parsedResponse.data);
  } catch {
    return NextResponse.json<GistResponse>(fallback);
  }
}
