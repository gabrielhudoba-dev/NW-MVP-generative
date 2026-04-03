/**
 * Hero matrix — defines ALLOWED options per slot.
 *
 * The matrix does not pick a winner. It only defines the boundary
 * of what scoring (deterministic + AI) is allowed to choose from.
 *
 * Currently returns all options for every state key.
 * Can be narrowed later per state key if needed.
 */

import { HEADLINES } from "../content/headlines";
import { DESCRIPTIONS } from "../content/descriptions";
import { CTAS } from "../content/ctas";
import { PROOFS } from "../content/proofs";

export interface HeroMatrixEntry {
  headline: string[];
  description: string[];
  cta: string[];
  proof: string[];
}

const ALL_OPTIONS: HeroMatrixEntry = {
  headline: HEADLINES.map((h) => h.id),
  description: DESCRIPTIONS.map((d) => d.id),
  cta: CTAS.map((c) => c.id),
  proof: PROOFS.map((p) => p.id),
};

/**
 * Returns allowed hero options for a given state key.
 * Currently returns all options — scoring handles differentiation.
 */
export function loadHeroMatrix(_stateKey: string): HeroMatrixEntry {
  return ALL_OPTIONS;
}
