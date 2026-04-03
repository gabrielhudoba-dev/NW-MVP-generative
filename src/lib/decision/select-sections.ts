/**
 * Section sequence selection — deterministic resolver.
 *
 * Uses the section sequence config to determine which sections
 * to show after the hero, based on the user state vector.
 */

import type { UserStateVector } from "../state/state-types";
import type { SectionId } from "../content/content-types";
import type { SectionSequenceDecision, SlotScore } from "./types";
import { deriveStateKey } from "../state/state-types";
import { resolveSectionSequence } from "../matrix/section-sequence";
import { SECTIONS_MAP } from "../content/sections";

/**
 * Selects section sequence deterministically.
 */
export function selectSectionsDeterministic(
  state: UserStateVector,
  isReturning: boolean,
  snapshotId: string
): SectionSequenceDecision {
  const stateKey = deriveStateKey(state);
  const sectionIds = resolveSectionSequence(state, isReturning);

  // Filter to only valid section IDs
  const validIds = sectionIds.filter((id) => SECTIONS_MAP[id] != null);

  return {
    section_ids: validIds,
    state_vector: state,
    state_key: stateKey,
    selection_method: "deterministic",
    allowed_ids: validIds,
    ai_scores: null,
    rules_applied: [],
    ai_error: "deterministic-only",
    snapshot_id: snapshotId,
    timestamp: Date.now(),
  };
}

/**
 * Applies AI-scored section ordering.
 * Takes AI scores and reorders allowed sections by score.
 */
export function applySectionAIScores(
  base: SectionSequenceDecision,
  aiScores: SlotScore[]
): SectionSequenceDecision {
  // Build score map
  const scoreMap = new Map(aiScores.map((s) => [s.id, s.score]));

  // Reorder by AI score (highest first), keeping only allowed IDs
  const reordered = [...base.section_ids].sort((a, b) => {
    const sa = scoreMap.get(a) ?? 0.5;
    const sb = scoreMap.get(b) ?? 0.5;
    return sb - sa;
  });

  return {
    ...base,
    section_ids: reordered as SectionId[],
    ai_scores: aiScores,
    selection_method: "ai",
    ai_error: null,
  };
}
