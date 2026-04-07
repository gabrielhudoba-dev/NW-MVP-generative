/**
 * Incompatibility and synergy rule tests.
 *
 * Tests the INCOMPATIBILITIES and SYNERGIES constants from variant-config.ts,
 * and verifies they are applied correctly by assembleWithReranking.
 */
import { describe, it, expect } from "vitest";
import {
  INCOMPATIBILITIES,
  SYNERGIES,
} from "@/lib/decision/variant-config";
import { assembleWithReranking } from "@/lib/decision/assembly";
import type { SlotScore, Slot } from "@/lib/decision/types";

function s(id: string, score = 0.5): SlotScore {
  return { id, score, reason: "test" };
}

function fullInitial(overrides: Partial<Record<Slot, SlotScore>>): Record<Slot, SlotScore> {
  return {
    hero:             s("clarity_speed"),
    description:      s("medium_authority"),
    proof:            s("kpi"),
    cta:              s("book_diagnostic"),
    section_sequence: s("position_proof_cta"),
    ...overrides,
  };
}

function fullCandidates(overrides: Partial<Record<Slot, SlotScore[]>>): Record<Slot, SlotScore[]> {
  return {
    hero:             [s("clarity_speed")],
    description:      [s("medium_authority")],
    proof:            [s("kpi")],
    cta:              [s("book_diagnostic")],
    section_sequence: [s("position_proof_cta")],
    ...overrides,
  };
}

// ─── Incompatibility config ───────────────────────────────────

describe("INCOMPATIBILITIES config", () => {
  it("has 3 incompatibility rules", () => {
    expect(INCOMPATIBILITIES).toHaveLength(3);
  });

  it("problem_authority + book_call_direct has penalty 0.08", () => {
    const rule = INCOMPATIBILITIES.find(
      (r) => r.slots.hero === "problem_authority" && r.slots.cta === "book_call_direct"
    );
    expect(rule).toBeDefined();
    expect(rule!.penalty).toBe(0.08);
  });

  it("none + book_call_direct has penalty 0.10", () => {
    const rule = INCOMPATIBILITIES.find(
      (r) => r.slots.proof === "none" && r.slots.cta === "book_call_direct"
    );
    expect(rule).toBeDefined();
    expect(rule!.penalty).toBe(0.10);
  });

  it("short_operator + position_logic_proof_cta has penalty 0.06", () => {
    const rule = INCOMPATIBILITIES.find(
      (r) =>
        r.slots.description === "short_operator" &&
        r.slots.section_sequence === "position_logic_proof_cta"
    );
    expect(rule).toBeDefined();
    expect(rule!.penalty).toBe(0.06);
  });
});

// ─── Synergy config ───────────────────────────────────────────

describe("SYNERGIES config", () => {
  it("has 3 synergy rules", () => {
    expect(SYNERGIES).toHaveLength(3);
  });

  it("digital_product_authority + kpi has boost 0.08", () => {
    const rule = SYNERGIES.find(
      (r) => r.slots.hero === "digital_product_authority" && r.slots.proof === "kpi"
    );
    expect(rule).toBeDefined();
    expect(rule!.boost).toBe(0.08);
  });

  it("quality_under_change + position_model_logic_cta has boost 0.06", () => {
    const rule = SYNERGIES.find(
      (r) =>
        r.slots.hero === "quality_under_change" &&
        r.slots.section_sequence === "position_model_logic_cta"
    );
    expect(rule).toBeDefined();
    expect(rule!.boost).toBe(0.06);
  });

  it("showreel_kpi + review_my_product has boost 0.07", () => {
    const rule = SYNERGIES.find(
      (r) => r.slots.proof === "showreel_kpi" && r.slots.cta === "review_my_product"
    );
    expect(rule).toBeDefined();
    expect(rule!.boost).toBe(0.07);
  });
});

// ─── Assembly integration: incompatibilities ──────────────────

describe("assembly - incompatibility triggers constraint", () => {
  it("records constraint when problem_authority + book_call_direct co-selected", () => {
    const initial = fullInitial({
      hero: s("problem_authority", 0.6),
      cta:  s("book_call_direct", 0.6),
    });
    const candidates = fullCandidates({
      hero: [s("problem_authority", 0.6), s("quality_under_change", 0.4)],
      cta:  [s("book_call_direct", 0.6), s("see_how_it_works", 0.4)],
    });

    const { constraints_applied } = assembleWithReranking(candidates, initial);

    const actioned =
      constraints_applied.some((c) => c.startsWith("reranked:")) ||
      constraints_applied.some((c) => c.startsWith("penalty:"));
    expect(actioned).toBe(true);
  });

  it("records constraint when none proof + book_call_direct co-selected", () => {
    const initial = fullInitial({
      proof: s("none", 0.6),
      cta:   s("book_call_direct", 0.6),
    });
    const candidates = fullCandidates({
      proof: [s("none", 0.6), s("kpi", 0.9)],
      cta:   [s("book_call_direct", 0.6), s("see_how_it_works", 0.3)],
    });

    const { constraints_applied } = assembleWithReranking(candidates, initial);

    const actioned =
      constraints_applied.some((c) => c.startsWith("reranked:")) ||
      constraints_applied.some((c) => c.startsWith("penalty:"));
    expect(actioned).toBe(true);
  });
});

// ─── Assembly integration: synergies ─────────────────────────

describe("assembly - synergy recorded in constraints_applied", () => {
  it("records synergy for showreel_kpi + review_my_product", () => {
    const initial = fullInitial({
      proof: s("showreel_kpi", 0.7),
      cta:   s("review_my_product", 0.7),
    });
    const candidates = fullCandidates({
      proof: [s("showreel_kpi", 0.7)],
      cta:   [s("review_my_product", 0.7)],
    });

    const { constraints_applied } = assembleWithReranking(candidates, initial);

    const synergies = constraints_applied.filter((c) => c.startsWith("synergy:"));
    expect(synergies.length).toBeGreaterThan(0);
    expect(
      synergies.some((c) => c.includes("showreel_kpi") || c.includes("review_my_product"))
    ).toBe(true);
  });

  it("records synergy for digital_product_authority + kpi", () => {
    const initial = fullInitial({
      hero:  s("digital_product_authority", 0.7),
      proof: s("kpi", 0.7),
    });
    const candidates = fullCandidates({
      hero:  [s("digital_product_authority", 0.7)],
      proof: [s("kpi", 0.7)],
    });

    const { constraints_applied } = assembleWithReranking(candidates, initial);

    const synergies = constraints_applied.filter((c) => c.startsWith("synergy:"));
    expect(synergies.some((c) => c.includes("digital_product_authority"))).toBe(true);
  });
});
