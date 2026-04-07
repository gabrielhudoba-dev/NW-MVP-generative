/**
 * User state vector — deterministic numeric representation of visitor intent.
 *
 * All scores are continuous 0–1, derived from context signals.
 * This is the single input to all downstream decisions (hero, sections, etc.).
 */

export interface UserStateVector {
  /** How ready the visitor is to take action (0 = browsing, 1 = ready to book) */
  intent_score: number;
  /** How much the visitor trusts the brand (0 = skeptical, 1 = high trust) */
  trust_score: number;
  /** Cognitive energy / willingness to read (0 = fatigued, 1 = sharp) */
  energy_score: number;
  /** How engaged / focused the visitor is (0 = distracted, 1 = locked in) */
  attention_score: number;
  /** How familiar the visitor is with NW (0 = first touch, 1 = returning regular) */
  familiarity_score: number;
}

// ─── Discrete Buckets ───────────────────────────────────────

export type IntentBucket = "exploring" | "evaluating" | "ready";
export type TrustBucket = "low" | "medium" | "high";
export type EnergyBucket = "low" | "medium" | "high";

export function intentBucket(state: UserStateVector): IntentBucket {
  if (state.intent_score >= 0.70) return "ready";
  if (state.intent_score >= 0.40) return "evaluating";
  return "exploring";
}

export function trustBucket(state: UserStateVector): TrustBucket {
  if (state.trust_score >= 0.60) return "high";
  if (state.trust_score >= 0.35) return "medium";
  return "low";
}

export function energyBucket(state: UserStateVector): EnergyBucket {
  if (state.energy_score >= 0.65) return "high";
  if (state.energy_score >= 0.35) return "medium";
  return "low";
}

// ─── State Key ──────────────────────────────────────────────

/**
 * Discrete state key for preset/config lookups.
 * Format: {intent}_{trust}_{energy}
 */
export function deriveStateKey(state: UserStateVector): string {
  const intent = intentBucket(state);
  const trust = trustBucket(state);
  const energy = energyBucket(state);
  return `${intent}_${trust}_${energy}`;
}
