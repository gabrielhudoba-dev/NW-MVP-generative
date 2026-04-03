import type { HeadlineOption } from "./content-types";

export const HEADLINES: HeadlineOption[] = [
  {
    id: "headline_problem_a",
    category: "problem",
    text: "Your product is growing. Clarity is breaking.",
  },
  {
    id: "headline_problem_b",
    category: "problem",
    text: "Growth is not the problem. Loss of clarity is.",
  },
  {
    id: "headline_authority_a",
    category: "authority",
    text: "We define how digital products should work.",
  },
  {
    id: "headline_authority_b",
    category: "authority",
    text: "Clarity, structure, and decisions that hold at scale.",
  },
  {
    id: "headline_action_a",
    category: "action",
    text: "See where your product starts to break.",
  },
];

export const HEADLINES_MAP: Record<string, HeadlineOption> = Object.fromEntries(
  HEADLINES.map((h) => [h.id, h])
);
