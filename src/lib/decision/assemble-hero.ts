import type { SlotScore, AssembledHero } from "../hero/types";
import { HEADLINES_MAP } from "../hero/matrix/headlines";
import { DESCRIPTIONS_MAP } from "../hero/matrix/descriptions";
import { CTAS_MAP } from "../hero/matrix/ctas";
import { PROOFS_MAP } from "../hero/matrix/proofs";

/**
 * Pick the highest-scoring option from a list of scored slots.
 */
function pickBest(scores: SlotScore[]): SlotScore {
  if (scores.length === 0) throw new Error("No scores to pick from");
  return scores.reduce((best, s) => (s.score > best.score ? s : best), scores[0]);
}

/**
 * Assembles the final hero from the top-scoring slot options.
 *
 * Returns the assembled hero with resolved content objects,
 * plus the list of rejected IDs for tracking.
 */
export function assembleHero(scores: {
  headline_scores: SlotScore[];
  description_scores: SlotScore[];
  cta_scores: SlotScore[];
  proof_scores: SlotScore[];
}): { assembled: AssembledHero; selected_ids: { headline_id: string; description_id: string; cta_id: string; proof_id: string }; rejected_ids: string[] } {
  const bestHeadline = pickBest(scores.headline_scores);
  const bestDescription = pickBest(scores.description_scores);
  const bestCta = pickBest(scores.cta_scores);
  const bestProof = pickBest(scores.proof_scores);

  const headline = HEADLINES_MAP[bestHeadline.id];
  const description = DESCRIPTIONS_MAP[bestDescription.id];
  const cta = CTAS_MAP[bestCta.id];
  const proof = PROOFS_MAP[bestProof.id];

  if (!headline || !description || !cta || !proof) {
    throw new Error(`Missing content for IDs: h=${bestHeadline.id} d=${bestDescription.id} c=${bestCta.id} p=${bestProof.id}`);
  }

  const selectedIds = new Set([bestHeadline.id, bestDescription.id, bestCta.id, bestProof.id]);
  const allIds = [
    ...scores.headline_scores.map((s) => s.id),
    ...scores.description_scores.map((s) => s.id),
    ...scores.cta_scores.map((s) => s.id),
    ...scores.proof_scores.map((s) => s.id),
  ];
  const rejected_ids = allIds.filter((id) => !selectedIds.has(id));

  return {
    assembled: { headline, description, cta, proof },
    selected_ids: {
      headline_id: bestHeadline.id,
      description_id: bestDescription.id,
      cta_id: bestCta.id,
      proof_id: bestProof.id,
    },
    rejected_ids,
  };
}
