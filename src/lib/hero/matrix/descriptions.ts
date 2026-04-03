import type { DescriptionOption } from "../types";

export const DESCRIPTIONS: DescriptionOption[] = [
  {
    id: "d_scale_fragment",
    text: "When products scale, decisions fragment. Features multiply. Systems drift. Teams lose sight of how it should actually work.",
    depth: "detailed",
    intended_use: "High-energy visitors who want to understand the problem",
  },
  {
    id: "d_structure_clarity",
    text: "We define how products should work — the structure, decisions, and systems that turn complexity into clarity.",
    depth: "standard",
    intended_use: "Trust-building, authority positioning",
  },
  {
    id: "d_cost_compounds",
    text: "Misaligned product decisions compound. The cost shows up later — in rework, drift, and lost momentum.",
    depth: "standard",
    intended_use: "Urgency-driven, action-oriented visitors",
  },
  {
    id: "d_precision_not_guess",
    text: "Native Works defines how your product should work — so your team builds with precision, not guesswork.",
    depth: "standard",
    intended_use: "General purpose, works across states",
  },
  {
    id: "d_one_conversation",
    text: "One conversation to see if we can help.",
    depth: "minimal",
    intended_use: "Low energy, returning visitors, mobile",
  },
  {
    id: "d_skip_intro",
    text: "You've been here before. Let's skip the intro.",
    depth: "minimal",
    intended_use: "Returning visitors only",
  },
  {
    id: "d_clear_thinking",
    text: "Clear product thinking. That's what we do.",
    depth: "minimal",
    intended_use: "Evening, low energy, minimal friction",
  },
];

export const DESCRIPTIONS_MAP = Object.fromEntries(
  DESCRIPTIONS.map((d) => [d.id, d])
) as Record<string, DescriptionOption>;
