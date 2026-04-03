import type { ProofOption } from "../types";

export const PROOFS: ProofOption[] = [
  {
    id: "proof_teams_at_scale",
    type: "social",
    label: "Social proof — teams at scale",
    content: "Trusted by product teams building at scale",
  },
  {
    id: "proof_no_pitch",
    type: "argument",
    label: "No-pitch promise",
    content: "30 minutes. No pitch. Just clarity.",
  },
  {
    id: "proof_precision",
    type: "argument",
    label: "Precision argument",
    content: "Teams ship better when product direction is precise.",
  },
  {
    id: "proof_none",
    type: "none",
    label: "No proof",
    content: "",
  },
];

export const PROOFS_MAP = Object.fromEntries(
  PROOFS.map((p) => [p.id, p])
) as Record<string, ProofOption>;
