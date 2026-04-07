/**
 * assembleWithReranking tests.
 *
 * Tests page-level incompatibility penalties and synergy boosts.
 */
import { describe, it, expect } from "vitest";
import { assembleWithReranking } from "@/lib/decision/assembly";
import type { SlotScore, Slot } from "@/lib/decision/types";

function makeScore(id: string, score = 0.5): SlotScore {
  return { id, score, reason: "test" };
}

function fullInitial(
  hero: string, description: string, proof: string, cta: string, seq: string,
  scores = 0.6
): Record<Slot, SlotScore> {
  return {
    hero:             makeScore(hero, scores),
    description:      makeScore(description, scores),
    proof:            makeScore(proof, scores),
    cta:              makeScore(cta, scores),
    section_sequence: makeScore(seq, scores),
  };
}

function fullCandidates(
  hero: string[], description: string[], proof: string[], cta: string[], seq: string[],
  score = 0.6
): Record<Slot, SlotScore[]> {
  return {
    hero:             hero.map((id) => makeScore(id, score)),
    description:      description.map((id) => makeScore(id, score)),
    proof:            proof.map((id) => makeScore(id, score)),
    cta:              cta.map((id) => makeScore(id, score)),
    section_sequence: seq.map((id) => makeScore(id, score)),
  };
}

// ─── No penalties/synergies ──────────────────────────────────

describe("assembleWithReranking - no interactions", () => {
  it("returns original selections when no incompatibilities or synergies match", () => {
    const initial = fullInitial("clarity_speed", "short_sharp", "kpi", "see_how_it_works", "position_proof_cta");
    const candidates = fullCandidates(
      ["clarity_speed"], ["short_sharp"], ["kpi"], ["see_how_it_works"], ["position_proof_cta"]
    );

    const { selections, constraints_applied } = assembleWithReranking(candidates, initial);

    expect(selections.hero.id).toBe("clarity_speed");
    expect(selections.proof.id).toBe("kpi");
    // No penalty constraints (synergy may appear if matched)
    const penalties = constraints_applied.filter((c) => c.startsWith("penalty:"));
    expect(penalties).toHaveLength(0);
  });
});

// ─── Synergies ────────────────────────────────────────────────

describe("assembleWithReranking - synergies", () => {
  it("records synergy for digital_product_authority + kpi", () => {
    const initial = fullInitial("digital_product_authority", "medium_authority", "kpi", "book_diagnostic", "position_model_logic_cta", 0.7);
    const candidates = fullCandidates(
      ["digital_product_authority"], ["medium_authority"], ["kpi"], ["book_diagnostic"], ["position_model_logic_cta"], 0.7
    );

    const { constraints_applied } = assembleWithReranking(candidates, initial);

    const synergies = constraints_applied.filter((c) => c.startsWith("synergy:"));
    expect(synergies.length).toBeGreaterThan(0);
    expect(synergies.some((s) => s.includes("digital_product_authority"))).toBe(true);
  });

  it("records synergy for showreel_kpi + review_my_product", () => {
    const initial = fullInitial("clarity_speed", "medium_outcome", "showreel_kpi", "review_my_product", "position_proof_cta", 0.7);
    const candidates = fullCandidates(
      ["clarity_speed"], ["medium_outcome"], ["showreel_kpi"], ["review_my_product"], ["position_proof_cta"], 0.7
    );

    const { constraints_applied } = assembleWithReranking(candidates, initial);

    const synergies = constraints_applied.filter((c) => c.startsWith("synergy:"));
    expect(synergies.length).toBeGreaterThan(0);
  });
});

// ─── Incompatibilities ────────────────────────────────────────

describe("assembleWithReranking - incompatibilities", () => {
  it("records constraint when problem_authority + book_call_direct co-selected", () => {
    const initial = fullInitial("problem_authority", "medium_authority", "kpi", "book_call_direct", "position_proof_cta");
    const candidates: Record<Slot, SlotScore[]> = {
      hero:             [makeScore("problem_authority", 0.6), makeScore("quality_under_change", 0.4)],
      description:      [makeScore("medium_authority", 0.6)],
      proof:            [makeScore("kpi", 0.6)],
      cta:              [makeScore("book_call_direct", 0.6), makeScore("see_how_it_works", 0.4)],
      section_sequence: [makeScore("position_proof_cta", 0.6)],
    };

    const { constraints_applied } = assembleWithReranking(candidates, initial);

    const actioned =
      constraints_applied.some((c) => c.startsWith("reranked:")) ||
      constraints_applied.some((c) => c.startsWith("penalty:"));
    expect(actioned).toBe(true);
  });

  it("records constraint when none + book_call_direct co-selected", () => {
    const initial = fullInitial("clarity_speed", "medium_authority", "none", "book_call_direct", "position_proof_cta");
    const candidates: Record<Slot, SlotScore[]> = {
      hero:             [makeScore("clarity_speed", 0.6)],
      description:      [makeScore("medium_authority", 0.6)],
      proof:            [makeScore("none", 0.6), makeScore("kpi", 0.9)], // better alt
      cta:              [makeScore("book_call_direct", 0.6), makeScore("see_how_it_works", 0.3)],
      section_sequence: [makeScore("position_proof_cta", 0.6)],
    };

    const { constraints_applied } = assembleWithReranking(candidates, initial);

    const actioned =
      constraints_applied.some((c) => c.startsWith("reranked:")) ||
      constraints_applied.some((c) => c.startsWith("penalty:"));
    expect(actioned).toBe(true);
  });
});

// ─── Return shape ─────────────────────────────────────────────

describe("assembleWithReranking - return shape", () => {
  it("always returns selections and constraints_applied", () => {
    const initial = fullInitial("clarity_speed", "medium_authority", "kpi", "book_diagnostic", "position_proof_cta");
    const candidates = fullCandidates(
      ["clarity_speed"], ["medium_authority"], ["kpi"], ["book_diagnostic"], ["position_proof_cta"]
    );

    const result = assembleWithReranking(candidates, initial);

    expect(result).toHaveProperty("selections");
    expect(result).toHaveProperty("constraints_applied");
    expect(Array.isArray(result.constraints_applied)).toBe(true);
    expect(result.selections.hero).toBeDefined();
    expect(result.selections.cta).toBeDefined();
  });
});
