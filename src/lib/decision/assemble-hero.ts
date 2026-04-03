/**
 * Hero assembly — picks the highest-scoring option per slot
 * and resolves to actual content objects.
 */

import type { HeroContent } from "../content/content-types";
import type { SlotScore } from "./types";
import { HEADLINES_MAP } from "../content/headlines";
import { DESCRIPTIONS_MAP } from "../content/descriptions";
import { CTAS_MAP } from "../content/ctas";
import { PROOFS_MAP } from "../content/proofs";

function pickBest(scores: SlotScore[]): SlotScore {
  if (scores.length === 0) throw new Error("No scores to pick from");
  return scores.reduce((best, s) => (s.score > best.score ? s : best), scores[0]);
}

export function assembleHero(scores: Record<string, SlotScore[]>): {
  content: HeroContent;
  selected_ids: Record<string, string>;
  rejected_ids: string[];
} {
  const bestHeadline = pickBest(scores.headline);
  const bestDescription = pickBest(scores.description);
  const bestCta = pickBest(scores.cta);
  const bestProof = pickBest(scores.proof);

  const headline = HEADLINES_MAP[bestHeadline.id];
  const description = DESCRIPTIONS_MAP[bestDescription.id];
  const cta = CTAS_MAP[bestCta.id];
  const proof = PROOFS_MAP[bestProof.id];

  if (!headline || !description || !cta || !proof) {
    throw new Error(
      `Missing hero content: h=${bestHeadline.id} d=${bestDescription.id} c=${bestCta.id} p=${bestProof.id}`
    );
  }

  const selectedIds = new Set([bestHeadline.id, bestDescription.id, bestCta.id, bestProof.id]);
  const allIds = [
    ...scores.headline.map((s) => s.id),
    ...scores.description.map((s) => s.id),
    ...scores.cta.map((s) => s.id),
    ...scores.proof.map((s) => s.id),
  ];

  return {
    content: { headline, description, cta, proof },
    selected_ids: {
      headline: bestHeadline.id,
      description: bestDescription.id,
      cta: bestCta.id,
      proof: bestProof.id,
    },
    rejected_ids: allIds.filter((id) => !selectedIds.has(id)),
  };
}

// ─── Fallback Content ───────────────────────────────────────

export const HERO_FALLBACK = {
  headline: "headline_authority_a",
  description: "desc_medium_a",
  cta: "cta_guided_a",
  proof: "proof_argument_a",
} as const;
