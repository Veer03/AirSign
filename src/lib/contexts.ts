import type { ContextId } from "./contracts";

export type Context = {
  id: ContextId;
  label: string;
  blurb: string;
  /** Sent to Gemini as a soft hint. Not a vocabulary. */
  promptHint: string;
  icon: "pill" | "utensils" | "train" | "bell" | "message";
};

export const CONTEXTS: Context[] = [
  {
    id: "pharmacy",
    label: "Pharmacy",
    blurb: "Counter, prescription, payment.",
    promptHint:
      "A pharmacy counter. Common needs: picking up a prescription, asking about stock, dosage questions, payment.",
    icon: "pill",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    blurb: "Ordering, allergies, the bill.",
    promptHint:
      "A restaurant. Common needs: a table, ordering, allergies, drinks, the bill.",
    icon: "utensils",
  },
  {
    id: "transit",
    label: "Transit",
    blurb: "Platforms, tickets, directions.",
    promptHint:
      "A transit station or platform. Common needs: tickets, platforms, directions, delays, seats.",
    icon: "train",
  },
  {
    id: "frontdesk",
    label: "Front desk",
    blurb: "Check-in, appointments, directions.",
    promptHint:
      "A front desk or reception. Common needs: check-in, appointments, waiting, directions, the elevator.",
    icon: "bell",
  },
  {
    id: "general",
    label: "General",
    blurb: "Everyday quick moments.",
    promptHint:
      "An everyday quick exchange. Keep the sentence short, polite, and first-person.",
    icon: "message",
  },
];

export function getContext(id: ContextId): Context {
  return CONTEXTS.find((context) => context.id === id) ?? CONTEXTS[0];
}
