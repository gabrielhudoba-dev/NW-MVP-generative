/**
 * Hero section config — plugs into the generic decision engine.
 */

import type { SectionConfig, SlotScore } from "../../decision/types";
import type { HeroContent } from "./types";
import { HEADLINES_MAP, DESCRIPTIONS_MAP, CTAS_MAP, PROOFS_MAP } from "./content";
import { lookupHeroMatrix } from "./matrix";
import { heroScoreDeterministic, heroBuildAIPrompt, heroParseAIResponse } from "./scoring";
import { HERO_RULES } from "./rules";
import type { Decision } from "../../decision/types";

// ─── Assembly ───────────────────────────────────────────────

function pickBest(scores: SlotScore[]): SlotScore {
  if (scores.length === 0) throw new Error("No scores to pick from");
  return scores.reduce((best, s) => (s.score > best.score ? s : best), scores[0]);
}

function heroAssemble(scores: Record<string, SlotScore[]>): {
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
      `Missing hero content for IDs: h=${bestHeadline.id} d=${bestDescription.id} c=${bestCta.id} p=${bestProof.id}`
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

// ─── Config ─────────────────────────────────────────────────

export const heroConfig: SectionConfig<HeroContent> = {
  section_id: "hero",
  slots: ["headline", "description", "cta", "proof"],
  lookupMatrix: lookupHeroMatrix,
  scoreDeterministic: heroScoreDeterministic,
  buildAIPrompt: heroBuildAIPrompt,
  parseAIResponse: heroParseAIResponse,
  rules: HERO_RULES,
  assemble: heroAssemble,
};

// ─── Re-exports ─────────────────────────────────────────────

export type { HeroContent } from "./types";
export type { HeadlineOption, DescriptionOption, CtaOption, ProofOption } from "./types";

/** Typed hero decision — the generic Decision with HeroContent */
export type HeroDecision = Decision<HeroContent>;
