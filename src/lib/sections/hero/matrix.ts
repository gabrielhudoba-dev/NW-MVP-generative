/**
 * Hero matrix — returns all options for every state.
 *
 * Selection is handled by deterministic scoring rules,
 * not by matrix filtering. The matrix exists to satisfy
 * the generic engine interface.
 */

import type { MatrixEntry } from "../../decision/types";
import { HEADLINES, DESCRIPTIONS, CTAS, PROOFS } from "./content";

const ALL_OPTIONS: MatrixEntry = {
  state_key: "*",
  allowed: {
    headline: HEADLINES.map((h) => h.id),
    description: DESCRIPTIONS.map((d) => d.id),
    cta: CTAS.map((c) => c.id),
    proof: PROOFS.map((p) => p.id),
  },
};

export function lookupHeroMatrix(_stateKey: string): MatrixEntry {
  return ALL_OPTIONS;
}
