/**
 * Soft constraints and hard guardrails tests.
 *
 * Tests the SOFT_CONSTRAINTS and HARD_GUARDRAILS from variant-config.ts
 * via the scoreSlot() function.
 */
import { describe, it, expect } from "vitest";
import { scoreSlot } from "@/lib/decision/score-variants";
import { SOFT_CONSTRAINTS, HARD_GUARDRAILS } from "@/lib/decision/variant-config";
import { makeState, makeCtx, makeDevice, makeMobile } from "../helpers";

// ─── Soft constraints ────────────────────────────────────────

describe("soft constraint: mobile_prefer_short_desc", () => {
  it("exists in SOFT_CONSTRAINTS", () => {
    expect(SOFT_CONSTRAINTS.some((c) => c.id === "mobile_prefer_short_desc")).toBe(true);
  });

  it("mobile boosts short_operator relative to desktop", () => {
    const state = makeState();
    const ctx   = makeCtx();

    const desktop = scoreSlot("description", state, ctx, makeDevice());
    const mobile  = scoreSlot("description", state, ctx, makeMobile());

    const get = (scores: typeof desktop, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(get(mobile, "short_operator")).toBeGreaterThan(get(desktop, "short_operator"));
    expect(get(mobile, "short_sharp")).toBeGreaterThan(get(desktop, "short_sharp"));
  });

  it("mobile penalises medium descriptions relative to desktop", () => {
    const state = makeState();
    const ctx   = makeCtx();

    const desktop = scoreSlot("description", state, ctx, makeDevice());
    const mobile  = scoreSlot("description", state, ctx, makeMobile());

    const get = (scores: typeof desktop, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(get(mobile, "medium_authority")).toBeLessThan(get(desktop, "medium_authority"));
    expect(get(mobile, "medium_outcome")).toBeLessThan(get(desktop, "medium_outcome"));
  });
});

describe("soft constraint: mobile_light_proof", () => {
  it("exists in SOFT_CONSTRAINTS", () => {
    expect(SOFT_CONSTRAINTS.some((c) => c.id === "mobile_light_proof")).toBe(true);
  });

  it("mobile penalises showreel_kpi relative to desktop", () => {
    const state = makeState();
    const ctx   = makeCtx();

    const desktop = scoreSlot("proof", state, ctx, makeDevice());
    const mobile  = scoreSlot("proof", state, ctx, makeMobile());

    const get = (scores: typeof desktop, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(get(mobile, "showreel_kpi")).toBeLessThan(get(desktop, "showreel_kpi"));
  });
});

describe("soft constraint: low_energy_no_proof", () => {
  it("exists in SOFT_CONSTRAINTS", () => {
    expect(SOFT_CONSTRAINTS.some((c) => c.id === "low_energy_no_proof")).toBe(true);
  });

  it("low energy penalises showreel relative to no-constraint scenario", () => {
    // energy=0.00 → constraint applies; energy=0.50 → no constraint (0.50 ≥ 0.35)
    const lowEnergy  = makeState({ energy_score: 0.00 }); // < 0.35 → constraint
    const highEnergy = makeState({ energy_score: 0.50 }); // ≥ 0.35 → no constraint
    const ctx = makeCtx();
    const dev = makeDevice();

    const low  = scoreSlot("proof", lowEnergy, ctx, dev);
    const high = scoreSlot("proof", highEnergy, ctx, dev);

    const get = (scores: typeof low, id: string) =>
      scores.find((s) => s.id === id)!.score;

    // showreel is penalised by multiplier 0.92 when energy is low
    expect(get(low, "showreel")).toBeLessThan(get(high, "showreel"));
    // showreel_kpi also penalised (0.90 multiplier)
    expect(get(low, "showreel_kpi")).toBeLessThan(get(high, "showreel_kpi"));
  });
});

describe("soft constraint: low_intent_soften_cta", () => {
  it("exists in SOFT_CONSTRAINTS", () => {
    expect(SOFT_CONSTRAINTS.some((c) => c.id === "low_intent_soften_cta")).toBe(true);
  });

  it("low intent boosts see_how_it_works and reduces book_call_direct", () => {
    const low  = makeState({ intent_score: 0.25, trust_score: 0.50 }); // < 0.40
    const high = makeState({ intent_score: 0.55, trust_score: 0.50 });
    const ctx = makeCtx();
    const dev = makeDevice();

    const lowScores  = scoreSlot("cta", low, ctx, dev);
    const highScores = scoreSlot("cta", high, ctx, dev);

    const get = (scores: typeof lowScores, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(get(lowScores, "see_how_it_works")).toBeGreaterThan(get(highScores, "see_how_it_works"));
    expect(get(lowScores, "book_call_direct")).toBeLessThan(get(highScores, "book_call_direct"));
  });
});

describe("soft constraint: high_intent_trust_direct_cta", () => {
  it("exists in SOFT_CONSTRAINTS", () => {
    expect(SOFT_CONSTRAINTS.some((c) => c.id === "high_intent_trust_direct_cta")).toBe(true);
  });

  it("high intent+trust boosts book_call_direct", () => {
    const low  = makeState({ intent_score: 0.50, trust_score: 0.40 });
    const high = makeState({ intent_score: 0.80, trust_score: 0.70 }); // >= 0.70 intent + >= 0.55 trust
    const ctx = makeCtx();
    const dev = makeDevice();

    const lowScores  = scoreSlot("cta", low, ctx, dev);
    const highScores = scoreSlot("cta", high, ctx, dev);

    const get = (scores: typeof lowScores, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(get(highScores, "book_call_direct")).toBeGreaterThan(get(lowScores, "book_call_direct"));
  });
});

// ─── Hard guardrails ─────────────────────────────────────────

describe("hard guardrail: brand_no_aggressive_cta_when_trust_very_low", () => {
  it("exists in HARD_GUARDRAILS", () => {
    expect(HARD_GUARDRAILS.some((g) => g.id === "brand_no_aggressive_cta_when_trust_very_low")).toBe(true);
  });

  it("excludes book_call_direct when trust < 0.20", () => {
    const state = makeState({ trust_score: 0.19 });
    const scores = scoreSlot("cta", state, makeCtx(), makeDevice());
    const direct = scores.find((s) => s.id === "book_call_direct")!;
    expect(direct.score).toBe(-1);
    expect(direct.reason).toBe("hard_guardrail");
  });

  it("does not exclude book_call_direct at exactly 0.20", () => {
    const state = makeState({ trust_score: 0.20 });
    const scores = scoreSlot("cta", state, makeCtx(), makeDevice());
    const direct = scores.find((s) => s.id === "book_call_direct")!;
    expect(direct.score).toBeGreaterThan(-1);
  });

  it("does not exclude other CTA variants with low trust", () => {
    const state = makeState({ trust_score: 0.15 });
    const scores = scoreSlot("cta", state, makeCtx(), makeDevice());
    const nonDirect = scores.filter((s) => s.id !== "book_call_direct");
    for (const s of nonDirect) {
      expect(s.score).toBeGreaterThan(-1);
    }
  });
});

describe("hard guardrail: mobile_no_heavy_sequence", () => {
  it("exists in HARD_GUARDRAILS", () => {
    expect(HARD_GUARDRAILS.some((g) => g.id === "mobile_no_heavy_sequence")).toBe(true);
  });

  it("excludes position_logic_proof_cta on mobile with energy < 0.25", () => {
    const state = makeState({ energy_score: 0.20 });
    const scores = scoreSlot("section_sequence", state, makeCtx(), makeMobile());
    const seq = scores.find((s) => s.id === "position_logic_proof_cta")!;
    expect(seq.score).toBe(-1);
  });

  it("does not exclude on mobile with energy >= 0.25", () => {
    const state = makeState({ energy_score: 0.30 });
    const scores = scoreSlot("section_sequence", state, makeCtx(), makeMobile());
    const seq = scores.find((s) => s.id === "position_logic_proof_cta")!;
    expect(seq.score).toBeGreaterThan(-1);
  });

  it("does not exclude on desktop even with very low energy", () => {
    const state = makeState({ energy_score: 0.10 });
    const scores = scoreSlot("section_sequence", state, makeCtx(), makeDevice());
    const seq = scores.find((s) => s.id === "position_logic_proof_cta")!;
    expect(seq.score).toBeGreaterThan(-1);
  });
});
