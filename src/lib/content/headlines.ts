import type { HeadlineOption } from "./content-types";

export const HEADLINES: HeadlineOption[] = [
  {
    id: "problem_authority",
    category: "problem",
    text: "Your product is growing. Clarity is breaking.",
  },
  {
    id: "clarity_speed",
    category: "action",
    text: "Your product grew. Your clarity didn't.",
  },
  {
    id: "digital_product_authority",
    category: "authority",
    text: "We define how digital products should work.",
  },
  {
    id: "quality_under_change",
    category: "authority",
    text: "Quality that holds as your product changes.",
  },
];

export const HEADLINES_MAP: Record<string, HeadlineOption> = Object.fromEntries(
  HEADLINES.map((h) => [h.id, h])
);
