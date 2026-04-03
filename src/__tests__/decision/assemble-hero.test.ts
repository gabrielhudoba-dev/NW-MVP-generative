import { describe, it, expect } from "vitest";
import { assembleHero, HERO_FALLBACK } from "@/lib/decision/assemble-hero";
import type { SlotScore } from "@/lib/decision/types";

function makeScores(overrides?: Partial<Record<string, SlotScore[]>>): Record<string, SlotScore[]> {
  return {
    headline: [
      { id: "headline_problem_a", score: 0.8, reason: "test" },
      { id: "headline_authority_a", score: 0.5, reason: "test" },
    ],
    description: [
      { id: "desc_medium_a", score: 0.7, reason: "test" },
      { id: "desc_short_a", score: 0.4, reason: "test" },
    ],
    cta: [
      { id: "cta_guided_a", score: 0.9, reason: "test" },
      { id: "cta_direct_a", score: 0.3, reason: "test" },
    ],
    proof: [
      { id: "proof_showreel_kpi_a", score: 0.85, reason: "test" },
      { id: "proof_argument_a", score: 0.5, reason: "test" },
    ],
    ...overrides,
  };
}

describe("assembleHero", () => {
  it("picks the highest-scoring option per slot", () => {
    const result = assembleHero(makeScores());
    expect(result.selected_ids.headline).toBe("headline_problem_a");
    expect(result.selected_ids.description).toBe("desc_medium_a");
    expect(result.selected_ids.cta).toBe("cta_guided_a");
    expect(result.selected_ids.proof).toBe("proof_showreel_kpi_a");
  });

  it("resolves to actual content objects", () => {
    const result = assembleHero(makeScores());
    expect(result.content.headline.text).toBeTruthy();
    expect(result.content.description.text).toBeTruthy();
    expect(result.content.cta.label).toBeTruthy();
    expect(result.content.proof.type).toBeTruthy();
  });

  it("populates rejected_ids with all non-winning IDs", () => {
    const result = assembleHero(makeScores());
    expect(result.rejected_ids).toContain("headline_authority_a");
    expect(result.rejected_ids).toContain("desc_short_a");
    expect(result.rejected_ids).toContain("cta_direct_a");
    expect(result.rejected_ids).toContain("proof_argument_a");
    expect(result.rejected_ids).not.toContain("headline_problem_a");
    expect(result.rejected_ids).not.toContain("cta_guided_a");
  });

  it("selected_ids has exactly 4 slots", () => {
    const result = assembleHero(makeScores());
    expect(Object.keys(result.selected_ids)).toEqual([
      "headline", "description", "cta", "proof",
    ]);
  });

  it("throws on empty scores array", () => {
    expect(() => assembleHero({
      headline: [],
      description: [{ id: "desc_medium_a", score: 0.5, reason: "test" }],
      cta: [{ id: "cta_guided_a", score: 0.5, reason: "test" }],
      proof: [{ id: "proof_argument_a", score: 0.5, reason: "test" }],
    })).toThrow();
  });

  it("throws on invalid content ID", () => {
    expect(() => assembleHero({
      headline: [{ id: "headline_nonexistent", score: 0.9, reason: "test" }],
      description: [{ id: "desc_medium_a", score: 0.5, reason: "test" }],
      cta: [{ id: "cta_guided_a", score: 0.5, reason: "test" }],
      proof: [{ id: "proof_argument_a", score: 0.5, reason: "test" }],
    })).toThrow(/Missing hero content/);
  });

  it("picks first option when scores are tied", () => {
    const scores = makeScores({
      headline: [
        { id: "headline_problem_a", score: 0.5, reason: "test" },
        { id: "headline_authority_a", score: 0.5, reason: "test" },
      ],
    });
    const result = assembleHero(scores);
    // reduce picks the first one that matches on tie
    expect(result.selected_ids.headline).toBe("headline_problem_a");
  });
});

describe("HERO_FALLBACK", () => {
  it("contains valid content IDs", () => {
    // Verify fallback IDs map to real content
    const scores: Record<string, SlotScore[]> = {
      headline: [{ id: HERO_FALLBACK.headline, score: 1, reason: "fallback" }],
      description: [{ id: HERO_FALLBACK.description, score: 1, reason: "fallback" }],
      cta: [{ id: HERO_FALLBACK.cta, score: 1, reason: "fallback" }],
      proof: [{ id: HERO_FALLBACK.proof, score: 1, reason: "fallback" }],
    };
    const result = assembleHero(scores);
    expect(result.content.headline.text).toBeTruthy();
    expect(result.content.cta.label).toBeTruthy();
  });
});
