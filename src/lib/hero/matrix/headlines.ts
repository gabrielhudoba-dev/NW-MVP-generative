import type { HeadlineOption } from "../types";

export const HEADLINES: HeadlineOption[] = [
  {
    id: "h_problem_clarity",
    label: "Clarity gap",
    text: "Your product grew.\nYour clarity didn't.",
    type: "problem",
    tone: "sharp",
    intended_use: "High-energy visitors who recognize complexity pain",
  },
  {
    id: "h_authority_complex",
    label: "Authority for complex",
    text: "Digital product authority\nfor complex systems.",
    type: "authority",
    tone: "calm",
    intended_use: "Trust-seeking visitors, social/referral traffic",
  },
  {
    id: "h_action_expensive",
    label: "Fix before expensive",
    text: "Fix your product thinking\nbefore it gets expensive.",
    type: "action",
    tone: "provocative",
    intended_use: "High-intent visitors ready to act, search/CPC traffic",
  },
  {
    id: "h_outcome_precision",
    label: "Precision outcome",
    text: "From product chaos\nto product precision.",
    type: "outcome",
    tone: "direct",
    intended_use: "Returning visitors, high familiarity",
  },
  {
    id: "h_problem_decisions",
    label: "Decision drift",
    text: "Good teams. Bad product decisions.\nIt happens fast.",
    type: "problem",
    tone: "provocative",
    intended_use: "First-time visitors with high energy",
  },
  {
    id: "h_authority_define",
    label: "We define how",
    text: "We define how your product\nshould actually work.",
    type: "authority",
    tone: "direct",
    intended_use: "High-trust, returning visitors",
  },
];

export const HEADLINES_MAP = Object.fromEntries(
  HEADLINES.map((h) => [h.id, h])
) as Record<string, HeadlineOption>;
