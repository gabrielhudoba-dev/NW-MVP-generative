/**
 * Post-scoring guardrails — applied after both deterministic and AI scoring.
 *
 * These are hard rules that override scores to enforce constraints.
 */

import type { UserStateVector } from "../state/state-types";
import type { DeviceContext } from "../analytics/device";
import type { SlotScore } from "./types";

export interface GuardrailRule {
  id: string;
  condition: (state: UserStateVector, device: DeviceContext) => boolean;
  apply: (scores: Record<string, SlotScore[]>) => Record<string, SlotScore[]>;
}

// ─── Hero Guardrails ────────────────────────────────────────

export const HERO_GUARDRAILS: GuardrailRule[] = [
  // Mobile → force short descriptions
  {
    id: "mobile_force_short_desc",
    condition: (_state, device) => device.device_type === "mobile",
    apply: (scores) => ({
      ...scores,
      description: scores.description.map((s) =>
        s.id.startsWith("desc_medium")
          ? { ...s, score: s.score * 0.4, reason: s.reason + " [mobile→short]" }
          : { ...s, score: Math.max(s.score, 0.7) }
      ),
    }),
  },

  // Mobile → avoid heavy proof
  {
    id: "mobile_avoid_heavy_proof",
    condition: (_state, device) => device.device_type === "mobile",
    apply: (scores) => ({
      ...scores,
      proof: scores.proof.map((s) => {
        if (s.id === "proof_none") return { ...s, score: Math.max(s.score, 0.7) };
        if (s.id === "proof_argument_a") return s;
        if (s.id === "proof_showreel_a") return { ...s, score: s.score * 0.5, reason: s.reason + " [mobile→light]" };
        if (s.id === "proof_showreel_kpi_a") return { ...s, score: s.score * 0.4, reason: s.reason + " [mobile→light]" };
        if (s.id === "proof_kpi_a") return { ...s, score: s.score * 0.6, reason: s.reason + " [mobile→light]" };
        return s;
      }),
    }),
  },

  // Low energy → prefer no proof
  {
    id: "low_energy_no_proof",
    condition: (state) => state.energy_score < 0.35,
    apply: (scores) => ({
      ...scores,
      proof: scores.proof.map((s) =>
        s.id === "proof_none"
          ? { ...s, score: Math.max(s.score, 0.85) }
          : { ...s, score: s.score * 0.5, reason: s.reason + " [low_energy→none]" }
      ),
    }),
  },
];

// ─── Apply Engine ───────────────────────────────────────────

export function applyHeroGuardrails(
  scores: Record<string, SlotScore[]>,
  state: UserStateVector,
  device: DeviceContext
): { scores: Record<string, SlotScore[]>; rules_applied: string[] } {
  const rules_applied: string[] = [];
  let current = structuredClone(scores);

  for (const rule of HERO_GUARDRAILS) {
    if (rule.condition(state, device)) {
      current = rule.apply(current);
      rules_applied.push(rule.id);
    }
  }

  return { scores: current, rules_applied };
}
