/**
 * Variant scoring engine — weighted sum of prior + posterior.
 *
 * For each variant in a slot:
 *   prior_score = Σ(state_dim × weight)
 *   final_score = prior_weight × prior_score + posterior_weight × posterior_mean
 *
 * Then soft constraints (multipliers) are applied.
 */

import type { UserStateVector } from "../state/state-types";
import type { VisitorContext } from "../context/collect-context";
import type { DeviceContext } from "../analytics/device";
import type { SlotScore, Slot } from "./types";
import {
  computePriorScore,
  VARIANT_PRIORS,
  SLOT_WEIGHTS,
  SOFT_CONSTRAINTS,
  HARD_GUARDRAILS,
} from "./variant-config";
import { getPosteriorMean } from "../learning/posterior";

/**
 * Scores all candidates for a given slot, combining prior and posterior,
 * then applies soft constraints. Hard guardrails set excluded variants to -1.
 */
export function scoreSlot(
  slot: Slot,
  state: UserStateVector,
  ctx: VisitorContext,
  device: DeviceContext
): SlotScore[] {
  const priors = VARIANT_PRIORS[slot];
  const { prior: priorWeight, posterior: posteriorWeight } = SLOT_WEIGHTS[slot];

  // Excluded by hard guardrails
  const excluded = new Set<string>();
  for (const g of HARD_GUARDRAILS) {
    if (g.slot === slot && g.condition(ctx, device, state)) {
      for (const id of g.exclude) excluded.add(id);
    }
  }

  // Build base scores from prior + posterior
  const scores: SlotScore[] = Object.keys(priors).map((id) => {
    if (excluded.has(id)) {
      return { id, score: -1, reason: "hard_guardrail" };
    }

    const priorScore = computePriorScore(state, priors[id]);
    const posteriorMean = getPosteriorMean(slot, id);
    const combined = priorWeight * priorScore + posteriorWeight * posteriorMean;

    return {
      id,
      score: Math.min(1, Math.max(0, combined)),
      reason: `prior=${priorScore.toFixed(3)} posterior=${posteriorMean.toFixed(3)}`,
    };
  });

  // Apply soft constraints (multipliers)
  for (const constraint of SOFT_CONSTRAINTS) {
    if (constraint.slot !== slot) continue;
    if (!constraint.condition(ctx, device, state)) continue;

    for (const s of scores) {
      if (s.score < 0) continue; // skip hard-excluded
      const mult = constraint.multipliers[s.id];
      if (mult !== undefined) {
        s.score = Math.min(1, Math.max(0, s.score * mult));
        s.reason += ` [${constraint.id}×${mult}]`;
      }
    }
  }

  return scores;
}
