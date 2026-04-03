import type { ProofOption } from "./content-types";

export const PROOFS: ProofOption[] = [
  {
    id: "proof_showreel_a",
    type: "showreel",
    content: "Short showreel of product work (10–20s, fast cuts, UI + flows)",
  },
  {
    id: "proof_kpi_a",
    type: "kpi",
    content: "Reduced onboarding friction by 32% | Improved task completion by 21%",
  },
  {
    id: "proof_argument_a",
    type: "argument",
    content: "Most products don't break because of features. They break because decisions stop making sense at scale.",
  },
  { id: "proof_none", type: "none", content: "" },
  {
    id: "proof_showreel_kpi_a",
    type: "showreel_kpi",
    content: "Reduced onboarding friction by 32% | Improved task completion by 21%",
  },
];

export const PROOFS_MAP: Record<string, ProofOption> = Object.fromEntries(
  PROOFS.map((p) => [p.id, p])
);
