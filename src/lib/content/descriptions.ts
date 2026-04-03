import type { DescriptionOption } from "./content-types";

export const DESCRIPTIONS: DescriptionOption[] = [
  {
    id: "desc_medium_a",
    length: "medium",
    text: "Native Works helps teams bring structure, clarity, and decision quality into complex digital products.",
  },
  {
    id: "desc_medium_b",
    length: "medium",
    text: "We help product teams define how systems should work before complexity turns into friction.",
  },
  {
    id: "desc_short_a",
    length: "short",
    text: "Structure before complexity breaks it.",
  },
  {
    id: "desc_short_b",
    length: "short",
    text: "Clarity that holds as you scale.",
  },
];

export const DESCRIPTIONS_MAP: Record<string, DescriptionOption> = Object.fromEntries(
  DESCRIPTIONS.map((d) => [d.id, d])
);
