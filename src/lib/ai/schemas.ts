/**
 * AI response schemas — parsing and validation for scoring responses.
 */

import type { SlotScore } from "../decision/types";

// ─── Hero AI Response ───────────────────────────────────────

interface RawSlotScore {
  id: string;
  score: number;
  reason?: string;
}

interface RawHeroAIResponse {
  headline_scores?: RawSlotScore[];
  description_scores?: RawSlotScore[];
  cta_scores?: RawSlotScore[];
  proof_scores?: RawSlotScore[];
}

function withReason(scores: RawSlotScore[]): SlotScore[] {
  return scores.map((s) => ({ id: s.id, score: s.score, reason: s.reason ?? "ai" }));
}

export function parseHeroAIResponse(raw: unknown): Record<string, SlotScore[]> | null {
  const d = raw as RawHeroAIResponse;

  if (
    !d.headline_scores?.length ||
    !d.description_scores?.length ||
    !d.cta_scores?.length ||
    !d.proof_scores?.length
  ) {
    console.warn("[ai] Invalid hero scoring response shape");
    return null;
  }

  return {
    headline: withReason(d.headline_scores),
    description: withReason(d.description_scores),
    cta: withReason(d.cta_scores),
    proof: withReason(d.proof_scores),
  };
}

// ─── Section AI Response ────────────────────────────────────

interface RawSectionAIResponse {
  section_scores?: RawSlotScore[];
}

export function parseSectionAIResponse(raw: unknown): SlotScore[] | null {
  const d = raw as RawSectionAIResponse;

  if (!d.section_scores?.length) {
    console.warn("[ai] Invalid section scoring response shape");
    return null;
  }

  return withReason(d.section_scores);
}
