import type { CtaOption } from "./content-types";

export const CTAS: CtaOption[] = [
  { id: "cta_direct_a", label: "Book a call", pressure: "direct" },
  { id: "cta_guided_a", label: "See how we work", pressure: "guided" },
  { id: "cta_soft_a", label: "Talk to us", pressure: "soft" },
  { id: "cta_diagnostic_a", label: "Get a quick breakdown", pressure: "diagnostic" },
];

export const CTAS_MAP: Record<string, CtaOption> = Object.fromEntries(
  CTAS.map((c) => [c.id, c])
);
