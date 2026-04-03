import type { CtaOption } from "../types";

export const CTAS: CtaOption[] = [
  {
    id: "cta_book_call",
    label: "Book a call",
    type: "book",
    pressure_level: "guided",
  },
  {
    id: "cta_book_15",
    label: "Book a 15-min call",
    type: "book",
    pressure_level: "direct",
  },
  {
    id: "cta_book_your",
    label: "Book your call",
    type: "book",
    pressure_level: "direct",
  },
  {
    id: "cta_lets_talk",
    label: "Let's talk",
    type: "book",
    pressure_level: "soft",
  },
  {
    id: "cta_book_now",
    label: "Book now",
    type: "book",
    pressure_level: "urgent",
  },
  {
    id: "cta_worth_conversation",
    label: "Worth a conversation?",
    type: "book",
    pressure_level: "soft",
  },
];

export const CTAS_MAP = Object.fromEntries(
  CTAS.map((c) => [c.id, c])
) as Record<string, CtaOption>;
