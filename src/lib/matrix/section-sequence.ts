/**
 * Section sequence configuration.
 *
 * Defines which sections are shown after the hero, and in what order,
 * based on intent bucket + trust/energy/visitor overrides.
 */

import type { SectionId } from "../content/content-types";
import type { UserStateVector } from "../state/state-types";
import { intentBucket, trustBucket, energyBucket } from "../state/state-types";

// ─── Config ─────────────────────────────────────────────────

interface SequenceOverrides {
  low_energy?: SectionId[];
  low_trust?: SectionId[];
  high_trust?: SectionId[];
  returning?: SectionId[];
}

interface IntentSequenceConfig {
  default: SectionId[];
  overrides: SequenceOverrides;
}

export const SECTION_SEQUENCE_CONFIG: Record<string, IntentSequenceConfig> = {
  exploring: {
    default: ["shift", "consequence", "position_light", "cta_soft"],
    overrides: {
      low_energy: ["shift", "consequence", "cta_soft"],
      low_trust: ["shift", "consequence", "position_light", "proof_showreel", "cta_soft"],
      high_trust: ["consequence", "position_light", "cta_soft"],
      returning: ["consequence", "position_light", "cta_soft"],
    },
  },

  evaluating: {
    default: ["position", "market_shift", "working_model", "intervention_logic", "cta_direct"],
    overrides: {
      low_energy: ["position", "working_model", "cta_direct"],
      low_trust: ["position", "market_shift", "proof_argument", "cta_soft"],
      high_trust: ["position", "working_model", "intervention_logic", "proof_kpi", "cta_direct"],
      returning: ["position", "working_model", "business_model", "cta_direct"],
    },
  },

  ready: {
    default: ["business_model", "cta_direct", "proof_optional"],
    overrides: {
      low_energy: ["business_model", "cta_direct"],
      low_trust: ["proof_showreel", "business_model", "cta_direct"],
      high_trust: ["business_model", "proof_kpi", "cta_direct"],
      returning: ["business_model", "cta_direct"],
    },
  },
};

// ─── Resolver ───────────────────────────────────────────────

/**
 * Resolves the section sequence from user state.
 *
 * Priority: returning > energy > trust > default
 * Only the first matching override is applied.
 */
export function resolveSectionSequence(
  state: UserStateVector,
  isReturning: boolean
): SectionId[] {
  const intent = intentBucket(state);
  const config = SECTION_SEQUENCE_CONFIG[intent];
  if (!config) return SECTION_SEQUENCE_CONFIG.exploring.default;

  const { overrides } = config;

  // Priority-ordered override resolution
  if (isReturning && overrides.returning) {
    return overrides.returning;
  }

  const energy = energyBucket(state);
  if (energy === "low" && overrides.low_energy) {
    return overrides.low_energy;
  }

  const trust = trustBucket(state);
  if (trust === "low" && overrides.low_trust) {
    return overrides.low_trust;
  }
  if (trust === "high" && overrides.high_trust) {
    return overrides.high_trust;
  }

  return config.default;
}
