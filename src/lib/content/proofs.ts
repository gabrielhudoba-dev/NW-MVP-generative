import type { ProofOption } from "./content-types";

export const PROOFS: ProofOption[] = [
  { id: "none", type: "none", content: "" },
  {
    id: "argument",
    type: "argument",
    content: "Most products don't break because of features. They break because decisions stop making sense at scale.",
  },
  {
    id: "showreel",
    type: "showreel",
    content: "Short showreel of product work (10–20s, fast cuts, UI + flows)",
  },
  {
    id: "kpi",
    type: "kpi",
    content: "Reduced onboarding friction by 32% | Improved task completion by 21%",
  },
  {
    id: "showreel_kpi",
    type: "showreel_kpi",
    content: "Reduced onboarding friction by 32% | Improved task completion by 21%",
  },
];

export const PROOFS_MAP: Record<string, ProofOption> = Object.fromEntries(
  PROOFS.map((p) => [p.id, p])
);
