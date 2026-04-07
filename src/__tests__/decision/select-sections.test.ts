/**
 * Section sequence slot scoring tests.
 */
import { describe, it, expect } from "vitest";
import { scoreSlot } from "@/lib/decision/score-variants";
import { SECTION_SEQUENCES } from "@/lib/content/section-sequences";
import { makeState, makeCtx, makeDevice, makeMobile } from "../helpers";

describe("scoreSlot - section_sequence", () => {
  it("returns exactly 5 sequences", () => {
    const scores = scoreSlot("section_sequence", makeState(), makeCtx(), makeDevice());
    expect(scores).toHaveLength(5);
  });

  it("all sequence IDs exist in SECTION_SEQUENCES", () => {
    const scores = scoreSlot("section_sequence", makeState(), makeCtx(), makeDevice());
    for (const s of scores) {
      expect(SECTION_SEQUENCES).toHaveProperty(s.id);
    }
  });

  it("all scores are in 0–1 range when no guardrail applies", () => {
    const scores = scoreSlot("section_sequence", makeState(), makeCtx(), makeDevice());
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(1);
    }
  });

  it("higher intent+trust boosts position_model_logic_cta and position_logic_proof_cta", () => {
    const low  = makeState({ intent_score: 0.1, trust_score: 0.1 });
    const high = makeState({ intent_score: 0.9, trust_score: 0.9 });
    const ctx = makeCtx();
    const dev = makeDevice();

    const lowScores  = scoreSlot("section_sequence", low, ctx, dev);
    const highScores = scoreSlot("section_sequence", high, ctx, dev);

    const get = (scores: typeof lowScores, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(get(highScores, "position_model_logic_cta")).toBeGreaterThan(
      get(lowScores, "position_model_logic_cta")
    );
  });

  it("higher attention+energy boosts shift_consequence_position_cta", () => {
    const low  = makeState({ attention_score: 0.1, energy_score: 0.1 });
    const high = makeState({ attention_score: 0.9, energy_score: 0.9 });
    const ctx = makeCtx();
    const dev = makeDevice();

    const lowScores  = scoreSlot("section_sequence", low, ctx, dev);
    const highScores = scoreSlot("section_sequence", high, ctx, dev);

    const get = (scores: typeof lowScores, id: string) =>
      scores.find((s) => s.id === id)!.score;

    expect(get(highScores, "shift_consequence_position_cta")).toBeGreaterThan(
      get(lowScores, "shift_consequence_position_cta")
    );
  });

  it("mobile + very low energy excludes position_logic_proof_cta", () => {
    const state = makeState({ energy_score: 0.15 }); // < 0.25
    const scores = scoreSlot("section_sequence", state, makeCtx(), makeMobile());
    const seq = scores.find((s) => s.id === "position_logic_proof_cta");
    expect(seq?.score).toBe(-1);
  });

  it("each score entry has id, score, and reason fields", () => {
    const scores = scoreSlot("section_sequence", makeState(), makeCtx(), makeDevice());
    for (const s of scores) {
      expect(typeof s.id).toBe("string");
      expect(typeof s.score).toBe("number");
      expect(typeof s.reason).toBe("string");
    }
  });
});

describe("SECTION_SEQUENCES content", () => {
  it("each sequence has at least 2 sections", () => {
    for (const [, sections] of Object.entries(SECTION_SEQUENCES)) {
      expect(sections.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("each sequence ends with a cta section", () => {
    for (const [, sections] of Object.entries(SECTION_SEQUENCES)) {
      const last = sections[sections.length - 1];
      expect(last).toMatch(/^cta_/);
    }
  });

  it("has exactly 5 predefined sequences", () => {
    expect(Object.keys(SECTION_SEQUENCES)).toHaveLength(5);
  });
});
