/**
 * Variant scoring configuration — encoded from YAML spec.
 *
 * Priors: weighted sum coefficients per state dimension.
 * Soft constraints: score multipliers by context condition.
 * Hard guardrails: exclusions for legal/brand-critical cases.
 * Presets: fallback mappings for cold-start (< 150 impressions).
 */

import type { UserStateVector } from "../state/state-types";
import type { VisitorContext } from "../context/collect-context";
import type { DeviceContext } from "../analytics/device";
import type { Slot } from "./types";

// ─── Prior Weight Config (per slot) ─────────────────────────

export const SLOT_WEIGHTS: Record<Slot, { prior: number; posterior: number }> = {
  hero:             { prior: 0.55, posterior: 0.45 },
  description:      { prior: 0.70, posterior: 0.30 },
  proof:            { prior: 0.50, posterior: 0.50 },
  cta:              { prior: 0.45, posterior: 0.55 },
  section_sequence: { prior: 0.60, posterior: 0.40 },
};

// ─── Variant Priors ─────────────────────────────────────────

/** Maps dimension names to state vector keys */
function dimScore(state: UserStateVector, dim: string): number {
  switch (dim) {
    case "intent":      return state.intent_score;
    case "trust":       return state.trust_score;
    case "energy":      return state.energy_score;
    case "attention":   return state.attention_score;
    case "familiarity": return state.familiarity_score;
    default: return 0;
  }
}

export interface VariantFormula {
  [dimension: string]: number;
}

export const VARIANT_PRIORS: Record<Slot, Record<string, VariantFormula>> = {
  hero: {
    problem_authority:        { intent: 0.25, trust: 0.10, attention: 0.15, familiarity: -0.05 },
    clarity_speed:            { intent: 0.18, trust: 0.12, attention: 0.12, energy: 0.08 },
    digital_product_authority:{ trust: 0.25, familiarity: 0.10, intent: 0.05 },
    quality_under_change:     { trust: 0.18, intent: 0.16, attention: 0.08 },
  },
  description: {
    short_operator:  { attention: 0.18, energy: 0.14, trust: -0.04 },
    medium_authority:{ trust: 0.16, intent: 0.08 },
    medium_outcome:  { intent: 0.14, trust: 0.10 },
    short_sharp:     { attention: 0.16, intent: 0.06 },
  },
  proof: {
    none:         { energy: 0.10, attention: 0.05, trust: -0.16 },
    argument:     { trust: 0.12, energy: 0.02 },
    showreel:     { attention: 0.16, trust: 0.06 },
    kpi:          { trust: 0.18, intent: 0.08 },
    showreel_kpi: { trust: 0.20, attention: 0.12, intent: 0.08 },
  },
  cta: {
    book_call_direct:   { intent: 0.28, trust: 0.16, energy: 0.06 },
    see_how_it_works:   { attention: 0.16, energy: 0.12, trust: 0.02 },
    review_my_product:  { trust: 0.14, intent: 0.20 },
    book_diagnostic:    { trust: 0.16, intent: 0.18, familiarity: 0.05 },
  },
  section_sequence: {
    shift_consequence_position_cta: { attention: 0.16, energy: 0.10 },
    position_model_logic_cta:       { intent: 0.16, trust: 0.12 },
    position_proof_cta:             { trust: 0.18, intent: 0.10 },
    position_case_cta:              { trust: 0.15, familiarity: 0.08 },
    position_logic_proof_cta:       { trust: 0.18, intent: 0.14 },
  },
};

/**
 * Computes the prior score for a variant given a state vector.
 * score = Σ(state_dim × weight)  (clamped 0–1)
 */
export function computePriorScore(state: UserStateVector, formula: VariantFormula): number {
  let score = 0;
  for (const [dim, weight] of Object.entries(formula)) {
    score += dimScore(state, dim) * weight;
  }
  return Math.min(1, Math.max(0, score));
}

// ─── Soft Constraints ────────────────────────────────────────

export interface SoftConstraint {
  id: string;
  slot: Slot;
  condition: (ctx: VisitorContext, device: DeviceContext, state: UserStateVector) => boolean;
  multipliers: Record<string, number>;
}

export const SOFT_CONSTRAINTS: SoftConstraint[] = [
  // Description: mobile boost short, penalise medium
  {
    id: "mobile_prefer_short_desc",
    slot: "description",
    condition: (_ctx, device) => device.device_type === "mobile",
    multipliers: {
      short_operator: 1.15,
      short_sharp:    1.10,
      medium_authority: 0.92,
      medium_outcome:   0.92,
    },
  },
  // Proof: mobile penalise heavy visuals
  {
    id: "mobile_light_proof",
    slot: "proof",
    condition: (_ctx, device) => device.device_type === "mobile",
    multipliers: {
      none:         1.05,
      argument:     1.00,
      showreel:     0.92,
      kpi:          0.95,
      showreel_kpi: 0.88,
    },
  },
  // Proof: low energy prefer none
  {
    id: "low_energy_no_proof",
    slot: "proof",
    condition: (_ctx, _device, state) => state.energy_score < 0.35,
    multipliers: {
      none:         1.08,
      argument:     0.96,
      showreel:     0.92,
      kpi:          0.95,
      showreel_kpi: 0.90,
    },
  },
  // CTA: low intent soften direct ask
  {
    id: "low_intent_soften_cta",
    slot: "cta",
    condition: (_ctx, _device, state) => state.intent_score < 0.40,
    multipliers: {
      see_how_it_works:  1.08,
      review_my_product: 1.02,
      book_call_direct:  0.94,
      book_diagnostic:   0.96,
    },
  },
  // CTA: high intent + trust boost direct
  {
    id: "high_intent_trust_direct_cta",
    slot: "cta",
    condition: (_ctx, _device, state) => state.intent_score >= 0.70 && state.trust_score >= 0.55,
    multipliers: {
      book_call_direct:  1.15,
      review_my_product: 1.06,
      see_how_it_works:  0.94,
      book_diagnostic:   1.02,
    },
  },
];

// ─── Hard Guardrails ─────────────────────────────────────────

export interface HardGuardrail {
  id: string;
  slot: Slot;
  condition: (ctx: VisitorContext, device: DeviceContext, state: UserStateVector) => boolean;
  exclude: string[];
}

export const HARD_GUARDRAILS: HardGuardrail[] = [
  {
    id: "brand_no_aggressive_cta_when_trust_very_low",
    slot: "cta",
    condition: (_ctx, _device, state) => state.trust_score < 0.20,
    exclude: ["book_call_direct"],
  },
  {
    id: "mobile_no_heavy_sequence",
    slot: "section_sequence",
    condition: (_ctx, device, state) => device.device_type === "mobile" && state.energy_score < 0.25,
    exclude: ["position_logic_proof_cta"],
  },
];

// ─── Assembly Rules ──────────────────────────────────────────

export interface Incompatibility {
  slots: Partial<Record<Slot, string>>;
  penalty: number;
}

export interface Synergy {
  slots: Partial<Record<Slot, string>>;
  boost: number;
}

export const PAGE_LEVEL_WEIGHTS: Record<Slot, number> = {
  hero:             0.22,
  description:      0.12,
  proof:            0.18,
  cta:              0.28,
  section_sequence: 0.20,
};

export const INCOMPATIBILITIES: Incompatibility[] = [
  { slots: { hero: "problem_authority", cta: "book_call_direct" },             penalty: 0.08 },
  { slots: { proof: "none",             cta: "book_call_direct" },             penalty: 0.10 },
  { slots: { description: "short_operator", section_sequence: "position_logic_proof_cta" }, penalty: 0.06 },
];

export const SYNERGIES: Synergy[] = [
  { slots: { hero: "digital_product_authority", proof: "kpi" },                        boost: 0.08 },
  { slots: { hero: "quality_under_change", section_sequence: "position_model_logic_cta" }, boost: 0.06 },
  { slots: { proof: "showreel_kpi", cta: "review_my_product" },                        boost: 0.07 },
];

// ─── Presets (cold-start fallback) ───────────────────────────

export interface PresetMapping {
  condition: (state: UserStateVector) => boolean;
  hero: string;
  description: string;
  proof: string;
  cta: string;
  section_sequence: string;
}

export const PRESETS: PresetMapping[] = [
  {
    condition: (s) => s.intent_score < 0.40 && s.trust_score < 0.35,
    hero: "problem_authority", description: "short_operator",
    proof: "argument", cta: "see_how_it_works",
    section_sequence: "shift_consequence_position_cta",
  },
  {
    condition: (s) => s.intent_score < 0.40 && s.trust_score >= 0.35,
    hero: "clarity_speed", description: "medium_authority",
    proof: "showreel_kpi", cta: "review_my_product",
    section_sequence: "position_proof_cta",
  },
  {
    condition: (s) => s.intent_score >= 0.40 && s.intent_score < 0.70 && s.trust_score < 0.35,
    hero: "quality_under_change", description: "medium_outcome",
    proof: "argument", cta: "review_my_product",
    section_sequence: "position_logic_proof_cta",
  },
  {
    condition: (s) => s.intent_score >= 0.40 && s.intent_score < 0.70 && s.trust_score >= 0.35,
    hero: "digital_product_authority", description: "medium_authority",
    proof: "kpi", cta: "book_diagnostic",
    section_sequence: "position_model_logic_cta",
  },
  {
    condition: (s) => s.intent_score >= 0.70 && s.trust_score >= 0.55,
    hero: "digital_product_authority", description: "medium_outcome",
    proof: "showreel_kpi", cta: "book_call_direct",
    section_sequence: "position_case_cta",
  },
];

/** Finds the first matching preset for a state vector (undefined if none match). */
export function findPreset(state: UserStateVector): PresetMapping | undefined {
  return PRESETS.find((p) => p.condition(state));
}
