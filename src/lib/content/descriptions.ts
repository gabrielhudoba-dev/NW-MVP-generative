import type { DescriptionOption } from "./content-types";

export const DESCRIPTIONS: DescriptionOption[] = [
  {
    id: "short_operator",
    length: "short",
    text: "Structure before complexity breaks it.",
  },
  {
    id: "medium_authority",
    length: "medium",
    text: "Native Works helps teams bring structure, clarity, and decision quality into complex digital products.",
  },
  {
    id: "medium_outcome",
    length: "medium",
    text: "We help product teams define how systems should work before complexity turns into friction.",
  },
  {
    id: "short_sharp",
    length: "short",
    text: "Clarity that holds as you scale.",
  },
];

export const DESCRIPTIONS_MAP: Record<string, DescriptionOption> = Object.fromEntries(
  DESCRIPTIONS.map((d) => [d.id, d])
);
