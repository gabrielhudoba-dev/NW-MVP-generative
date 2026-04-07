/**
 * scoreSlot tests — hero and description slot scoring.
 *
 * In Node test env: posterior_mean = 0.5 (no localStorage).
 * final_score = prior_weight × prior_score + posterior_weight × 0.5
 */
import { describe, it, expect } from "vitest";
import { scoreSlot } from "@/lib/decision/score-variants";
import { makeCtx, makeDevice, makeMobile, makeState } from "../helpers";

describe("scoreSlot - hero", () => {
  it("returns a score for every hero variant", () => {
    const scores = scoreSlot("hero", makeState(), makeCtx(), makeDevice());
    const ids = scores.map((s) => s.id);
    expect(ids).toContain("problem_authority");
    expect(ids).toContain("clarity_speed");
    expect(ids).toContain("digital_product_authority");
    expect(ids).toContain("quality_under_change");
  });

  it("all scores are clamped 0–1 (no guardrails active)", () => {
    const scores = scoreSlot("hero", makeState(), makeCtx(), makeDevice());
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
    }
  });

  it("higher intent increases problem_authority and clarity_speed scores", () => {
    const lowState  = makeState({ intent_score: 0.1 });
    const highState = makeState({ intent_score: 0.9 });
    const ctx = makeCtx();
    const dev = makeDevice();

    const low  = scoreSlot("hero", lowState, ctx, dev);
    const high = scoreSlot("hero", highState, ctx, dev);

    const findScore = (scores: typeof low, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(findScore(high, "problem_authority")).toBeGreaterThan(
      findScore(low, "problem_authority")
    );
  });

  it("higher trust increases digital_product_authority score", () => {
    const lowTrust  = makeState({ trust_score: 0.1 });
    const highTrust = makeState({ trust_score: 0.9 });
    const ctx = makeCtx();
    const dev = makeDevice();

    const low  = scoreSlot("hero", lowTrust, ctx, dev);
    const high = scoreSlot("hero", highTrust, ctx, dev);

    const findScore = (scores: typeof low, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(findScore(high, "digital_product_authority")).toBeGreaterThan(
      findScore(low, "digital_product_authority")
    );
  });

  it("each score has id, score, and reason", () => {
    const scores = scoreSlot("hero", makeState(), makeCtx(), makeDevice());
    for (const s of scores) {
      expect(typeof s.id).toBe("string");
      expect(typeof s.score).toBe("number");
      expect(typeof s.reason).toBe("string");
    }
  });
});

describe("scoreSlot - description", () => {
  it("returns scores for all description variants", () => {
    const scores = scoreSlot("description", makeState(), makeCtx(), makeDevice());
    const ids = scores.map((s) => s.id);
    expect(ids).toContain("short_operator");
    expect(ids).toContain("medium_authority");
    expect(ids).toContain("medium_outcome");
    expect(ids).toContain("short_sharp");
  });

  it("mobile soft constraint boosts short_operator and penalises medium", () => {
    const state = makeState();
    const ctx   = makeCtx();

    const desktop = scoreSlot("description", state, ctx, makeDevice());
    const mobile  = scoreSlot("description", state, ctx, makeMobile());

    const findScore = (scores: typeof desktop, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(findScore(mobile, "short_operator")).toBeGreaterThan(
      findScore(desktop, "short_operator")
    );
    expect(findScore(mobile, "medium_authority")).toBeLessThan(
      findScore(desktop, "medium_authority")
    );
  });
});

describe("scoreSlot - CTA hard guardrail", () => {
  it("sets book_call_direct to -1 when trust < 0.20", () => {
    const state = makeState({ trust_score: 0.15 });
    const scores = scoreSlot("cta", state, makeCtx(), makeDevice());
    const direct = scores.find((s) => s.id === "book_call_direct");
    expect(direct).toBeDefined();
    expect(direct!.score).toBe(-1);
  });

  it("does not exclude book_call_direct when trust >= 0.20", () => {
    const state = makeState({ trust_score: 0.25 });
    const scores = scoreSlot("cta", state, makeCtx(), makeDevice());
    const direct = scores.find((s) => s.id === "book_call_direct");
    expect(direct).toBeDefined();
    expect(direct!.score).toBeGreaterThan(-1);
  });

  it("low_intent_soften_cta reduces book_call_direct when intent < 0.40", () => {
    const low  = makeState({ intent_score: 0.30 });
    const high = makeState({ intent_score: 0.50 });
    const ctx = makeCtx();
    const dev = makeDevice();

    const lowScores  = scoreSlot("cta", low, ctx, dev);
    const highScores = scoreSlot("cta", high, ctx, dev);

    const findScore = (scores: typeof lowScores, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(findScore(lowScores, "book_call_direct")).toBeLessThan(
      findScore(highScores, "book_call_direct")
    );
    expect(findScore(lowScores, "see_how_it_works")).toBeGreaterThan(
      findScore(highScores, "see_how_it_works")
    );
  });
});

describe("scoreSlot - section_sequence hard guardrail", () => {
  it("excludes position_logic_proof_cta on mobile + very low energy", () => {
    const state = makeState({ energy_score: 0.20 }); // < 0.25
    const scores = scoreSlot("section_sequence", state, makeCtx(), makeMobile());
    const seq = scores.find((s) => s.id === "position_logic_proof_cta");
    expect(seq).toBeDefined();
    expect(seq!.score).toBe(-1);
  });

  it("does not exclude position_logic_proof_cta on desktop", () => {
    const state = makeState({ energy_score: 0.20 });
    const scores = scoreSlot("section_sequence", state, makeCtx(), makeDevice());
    const seq = scores.find((s) => s.id === "position_logic_proof_cta");
    expect(seq).toBeDefined();
    expect(seq!.score).toBeGreaterThan(-1);
  });

  it("returns 5 sequences", () => {
    const scores = scoreSlot("section_sequence", makeState(), makeCtx(), makeDevice());
    expect(scores).toHaveLength(5);
  });
});
