import type { Candidate, ContextId, GistResponse, SignCapture } from "./contracts";

export type MockSign = {
  candidates: Candidate[];
  gist: string;
  confidence: number;
  uncertain: boolean;
  alternatives: string[];
  note: string;
};

/**
 * Deterministic demo data. Each entry is a plausible short burst of signing
 * for a context. It is not a sign-language dictionary and must not be
 * presented as one.
 */
export const MOCK_SIGNS: Record<ContextId, MockSign[]> = {
  pharmacy: [
    {
      candidates: [
        { label: "need", confidence: 0.84 },
        { label: "prescription", confidence: 0.79 },
        { label: "pick up", confidence: 0.66 },
      ],
      gist: "I need to pick up a prescription, please.",
      confidence: 0.84,
      uncertain: false,
      alternatives: [],
      note: "High confidence. Please confirm before speaking.",
    },
    {
      candidates: [
        { label: "medicine", confidence: 0.71 },
        { label: "have", confidence: 0.63 },
        { label: "question", confidence: 0.58 },
      ],
      gist: "Do you have this medicine in stock?",
      confidence: 0.71,
      uncertain: false,
      alternatives: ["Can I ask about this medicine?"],
      note: "Please confirm the medicine before speaking.",
    },
    {
      candidates: [
        { label: "question", confidence: 0.57 },
        { label: "dosage", confidence: 0.52 },
        { label: "help", confidence: 0.48 },
      ],
      gist: "I have a question about the dosage.",
      confidence: 0.52,
      uncertain: true,
      alternatives: [
        "I need help with this medicine.",
        "Could you explain the dosage?",
      ],
      note: "Low confidence. Please confirm or try again.",
    },
    {
      candidates: [
        { label: "thank you", confidence: 0.91 },
        { label: "done", confidence: 0.72 },
      ],
      gist: "Thank you, that's all.",
      confidence: 0.91,
      uncertain: false,
      alternatives: [],
      note: "High confidence. Please confirm before speaking.",
    },
  ],
  restaurant: [
    {
      candidates: [
        { label: "table", confidence: 0.86 },
        { label: "two", confidence: 0.68 },
        { label: "please", confidence: 0.61 },
      ],
      gist: "A table for two, please.",
      confidence: 0.86,
      uncertain: false,
      alternatives: [],
      note: "High confidence. Please confirm before speaking.",
    },
    {
      candidates: [
        { label: "allergy", confidence: 0.74 },
        { label: "food", confidence: 0.69 },
        { label: "question", confidence: 0.6 },
      ],
      gist: "I have a food allergy. Could you check the ingredients?",
      confidence: 0.74,
      uncertain: false,
      alternatives: ["Does this dish contain nuts?"],
      note: "Please confirm the allergy details before speaking.",
    },
    {
      candidates: [
        { label: "bill", confidence: 0.55 },
        { label: "please", confidence: 0.5 },
        { label: "pay", confidence: 0.47 },
      ],
      gist: "Could we get the bill, please?",
      confidence: 0.55,
      uncertain: true,
      alternatives: ["Can I pay now?", "The bill, please."],
      note: "Low confidence. Please confirm or try again.",
    },
  ],
  transit: [
    {
      candidates: [
        { label: "platform", confidence: 0.81 },
        { label: "which", confidence: 0.73 },
        { label: "train", confidence: 0.62 },
      ],
      gist: "Which platform does this train leave from?",
      confidence: 0.81,
      uncertain: false,
      alternatives: [],
      note: "High confidence. Please confirm before speaking.",
    },
    {
      candidates: [
        { label: "ticket", confidence: 0.76 },
        { label: "airport", confidence: 0.61 },
        { label: "need", confidence: 0.58 },
      ],
      gist: "I need a ticket to the airport.",
      confidence: 0.76,
      uncertain: false,
      alternatives: ["How do I get a ticket to the airport?"],
      note: "Please confirm the destination before speaking.",
    },
    {
      candidates: [
        { label: "seat", confidence: 0.54 },
        { label: "taken", confidence: 0.5 },
        { label: "question", confidence: 0.44 },
      ],
      gist: "Is this seat taken?",
      confidence: 0.54,
      uncertain: true,
      alternatives: ["Can I sit here?", "Is this seat free?"],
      note: "Low confidence. Please confirm or try again.",
    },
  ],
  frontdesk: [
    {
      candidates: [
        { label: "appointment", confidence: 0.83 },
        { label: "have", confidence: 0.7 },
        { label: "two o'clock", confidence: 0.59 },
      ],
      gist: "I have an appointment at two o'clock.",
      confidence: 0.83,
      uncertain: false,
      alternatives: [],
      note: "High confidence. Please confirm the time before speaking.",
    },
    {
      candidates: [
        { label: "check in", confidence: 0.78 },
        { label: "here", confidence: 0.64 },
        { label: "name", confidence: 0.52 },
      ],
      gist: "I'm here to check in.",
      confidence: 0.78,
      uncertain: false,
      alternatives: ["I have a reservation."],
      note: "Please confirm before speaking.",
    },
    {
      candidates: [
        { label: "elevator", confidence: 0.56 },
        { label: "where", confidence: 0.51 },
        { label: "help", confidence: 0.46 },
      ],
      gist: "Could you tell me where the elevator is?",
      confidence: 0.56,
      uncertain: true,
      alternatives: ["Where is the elevator?", "Can you point me to the elevator?"],
      note: "Low confidence. Please confirm or try again.",
    },
  ],
  general: [
    {
      candidates: [
        { label: "hello", confidence: 0.88 },
        { label: "help", confidence: 0.7 },
        { label: "moment", confidence: 0.55 },
      ],
      gist: "Hello, could you help me for a moment?",
      confidence: 0.88,
      uncertain: false,
      alternatives: [],
      note: "High confidence. Please confirm before speaking.",
    },
    {
      candidates: [
        { label: "question", confidence: 0.68 },
        { label: "ask", confidence: 0.62 },
        { label: "please", confidence: 0.54 },
      ],
      gist: "I need to ask a question.",
      confidence: 0.68,
      uncertain: false,
      alternatives: ["Can I ask you something?"],
      note: "Please confirm before speaking.",
    },
    {
      candidates: [
        { label: "wait", confidence: 0.53 },
        { label: "moment", confidence: 0.49 },
        { label: "please", confidence: 0.45 },
      ],
      gist: "Please wait a moment.",
      confidence: 0.53,
      uncertain: true,
      alternatives: ["One moment, please.", "Could you wait a moment?"],
      note: "Low confidence. Please confirm or try again.",
    },
    {
      candidates: [
        { label: "thank you", confidence: 0.93 },
        { label: "appreciate", confidence: 0.71 },
      ],
      gist: "Thank you, I appreciate it.",
      confidence: 0.93,
      uncertain: false,
      alternatives: [],
      note: "High confidence. Please confirm before speaking.",
    },
  ],
};

export function mockSignAt(context: ContextId, index: number): MockSign {
  const list = MOCK_SIGNS[context] ?? MOCK_SIGNS.general;
  return list[index % list.length];
}

/**
 * Build a demo capture without a camera. Deterministic per index so the demo
 * is repeatable. `summary` is fake numeric data, shaped like normalized
 * landmarks, and is never used as if it were real.
 */
export function mockCapture(
  context: ContextId,
  index: number,
  captureMs = 3000,
): SignCapture {
  const sign = mockSignAt(context, index);
  return {
    context,
    frames: Math.round(captureMs / 66),
    durationMs: captureMs,
    candidates: sign.candidates,
    summary: sign.candidates.flatMap((candidate, i) => [
      Number((candidate.confidence * 0.5).toFixed(3)),
      Number(((i + 1) * 0.07).toFixed(3)),
    ]),
  };
}

export function mockGist(context: ContextId, index: number): GistResponse {
  const sign = mockSignAt(context, index);
  return {
    gist: sign.gist,
    uncertain: sign.uncertain,
    confidence: sign.confidence,
    alternatives: sign.alternatives,
    note: sign.note,
  };
}
