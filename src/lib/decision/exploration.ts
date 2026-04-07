/**
 * Epsilon-greedy exploration.
 *
 * With probability ε → pick a random eligible variant (explore).
 * Otherwise → pick highest-scoring variant (exploit).
 *
 * Epsilon selection (first matching rule wins):
 *   - Any slot variant has < 500 impressions → ε = 0.22
 *   - Returning visitor                      → ε = 0.08
 *   - Default                                → ε = 0.15
 */

import type { VisitorContext } from "../context/collect-context";
import type { SlotScore, DecisionMode } from "./types";
import { getSlotMinImpressions } from "../learning/impressions";

const EPSILON_NEW_VARIANT    = 0.22; // any variant under 500 impressions
const EPSILON_RETURNING      = 0.08; // returning visitor — less exploration needed
const EPSILON_DEFAULT        = 0.15;

const MIN_IMPRESSIONS_THRESHOLD = 500;

/**
 * Computes the epsilon value for a given slot + context.
 */
export function getEpsilon(
  ctx: VisitorContext,
  variantIds: string[],
  slot: string
): number {
  // Under-explored variants → higher exploration
  if (getSlotMinImpressions(slot, variantIds) < MIN_IMPRESSIONS_THRESHOLD) {
    return EPSILON_NEW_VARIANT;
  }
  // Returning visitor already has strong signal → lower exploration
  if (ctx.isReturning) {
    return EPSILON_RETURNING;
  }
  return EPSILON_DEFAULT;
}

/**
 * Selects a variant using epsilon-greedy.
 *
 * Eligible candidates are those with score >= 0 (not hard-excluded).
 * If all are excluded, returns the first with score >= 0 as fallback.
 */
export function selectVariant(
  scores: SlotScore[],
  epsilon: number
): { selected: SlotScore; mode: DecisionMode } {
  const eligible = scores.filter((s) => s.score >= 0);

  if (eligible.length === 0) {
    // All excluded — pick highest raw (shouldn't happen in practice)
    const fallback = scores.reduce((a, b) => (a.score > b.score ? a : b), scores[0]);
    return { selected: fallback, mode: "exploit" };
  }

  const shouldExplore = Math.random() < epsilon;

  if (shouldExplore) {
    const random = eligible[Math.floor(Math.random() * eligible.length)];
    return { selected: random, mode: "explore" };
  }

  const best = eligible.reduce((a, b) => (a.score > b.score ? a : b), eligible[0]);
  return { selected: best, mode: "exploit" };
}
