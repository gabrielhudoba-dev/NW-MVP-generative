/**
 * Page-level assembly and reranking.
 *
 * After each slot independently selects a winner, assembly checks for
 * cross-slot incompatibilities (penalties) and synergies (boosts).
 *
 * If a combination is suboptimal (penalty outweighs synergy), a swap
 * is attempted for the penalized slot to find a better overall fit.
 */

import type { SlotScore, Slot } from "./types";
import {
  INCOMPATIBILITIES,
  SYNERGIES,
  PAGE_LEVEL_WEIGHTS,
} from "./variant-config";

export type SlotSelections = Record<Slot, SlotScore>;

/**
 * Computes the net page-level adjustment for a set of slot selections.
 * Returns: { adjustment: number; penalties: string[]; boosts: string[] }
 */
function computePageAdjustment(selections: SlotSelections): {
  adjustment: number;
  penalties: string[];
  boosts: string[];
} {
  let adjustment = 0;
  const penalties: string[] = [];
  const boosts: string[] = [];

  for (const inc of INCOMPATIBILITIES) {
    const matches = Object.entries(inc.slots).every(
      ([slot, variantId]) => selections[slot as Slot]?.id === variantId
    );
    if (matches) {
      adjustment -= inc.penalty;
      penalties.push(Object.values(inc.slots).join("+"));
    }
  }

  for (const syn of SYNERGIES) {
    const matches = Object.entries(syn.slots).every(
      ([slot, variantId]) => selections[slot as Slot]?.id === variantId
    );
    if (matches) {
      adjustment += syn.boost;
      boosts.push(Object.values(syn.slots).join("+"));
    }
  }

  return { adjustment, penalties, boosts };
}

/**
 * Weighted page score:  Σ(slot_weight × slot_score) + page_adjustment
 */
function pageScore(selections: SlotSelections, adjustment: number): number {
  let score = 0;
  for (const [slot, sel] of Object.entries(selections)) {
    score += PAGE_LEVEL_WEIGHTS[slot as Slot] * Math.max(0, sel.score);
  }
  return score + adjustment;
}

/**
 * Reassemble slot selections after checking incompatibilities and synergies.
 * Attempts a single-slot swap for penalized slots if it improves the page score.
 *
 * Returns the final selections and the list of constraints that were applied.
 */
export function assembleWithReranking(
  slotCandidates: Record<Slot, SlotScore[]>,
  initial: SlotSelections
): { selections: SlotSelections; constraints_applied: string[] } {
  let current = { ...initial };
  const constraints_applied: string[] = [];

  const { adjustment, penalties } = computePageAdjustment(current);

  if (adjustment < 0 && penalties.length > 0) {
    // Try swapping each penalized slot to find a better page-level score
    const baseScore = pageScore(current, adjustment);

    for (const [slot, candidates] of Object.entries(slotCandidates) as [Slot, SlotScore[]][]) {
      const currentId = current[slot].id;
      const eligible = candidates.filter((c) => c.score >= 0 && c.id !== currentId);

      for (const alt of eligible) {
        const trial = { ...current, [slot]: alt };
        const { adjustment: trialAdj } = computePageAdjustment(trial);
        const trialScore = pageScore(trial, trialAdj);

        if (trialScore > baseScore) {
          current = trial;
          constraints_applied.push(`reranked:${slot}:${currentId}→${alt.id}`);
          break; // one swap per slot
        }
      }
    }
  }

  // Record active synergies and incompatibilities in final selection
  const { penalties: finalPenalties, boosts: finalBoosts } = computePageAdjustment(current);
  for (const p of finalPenalties) constraints_applied.push(`penalty:${p}`);
  for (const b of finalBoosts) constraints_applied.push(`synergy:${b}`);

  return { selections: current, constraints_applied };
}
