import type { CtaOption } from "./content-types";

export const CTAS: CtaOption[] = [
  { id: "book_call_direct",  label: "Book a call",         pressure: "direct" },
  { id: "see_how_it_works",  label: "See how it works",    pressure: "guided" },
  { id: "review_my_product", label: "Review my product",   pressure: "soft" },
  { id: "book_diagnostic",   label: "Book a diagnostic",   pressure: "diagnostic" },
];

export const CTAS_MAP: Record<string, CtaOption> = Object.fromEntries(
  CTAS.map((c) => [c.id, c])
);
