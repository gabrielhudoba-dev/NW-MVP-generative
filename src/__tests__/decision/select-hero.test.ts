import { describe, it, expect } from "vitest";
import { scoreHeroDeterministic } from "@/lib/decision/select-hero";
import { loadHeroMatrix } from "@/lib/matrix/hero-matrix";
import { makeState } from "../helpers";

const matrix = loadHeroMatrix("any");

function topId(slot: string, state: Parameters<typeof scoreHeroDeterministic>[0]) {
  const result = scoreHeroDeterministic(state, matrix);
  const sorted = [...result.scores[slot]].sort((a, b) => b.score - a.score);
  return sorted[0].id;
}

function scoreOf(slot: string, id: string, state: Parameters<typeof scoreHeroDeterministic>[0]) {
  const result = scoreHeroDeterministic(state, matrix);
  return result.scores[slot].find((s) => s.id === id)?.score ?? -1;
}

// ── Headlines ────────────────────────────────────────────────

describe("headline scoring", () => {
  it("prefers problem headlines when exploring", () => {
    const state = makeState({ intent_score: 0.2 }); // exploring
    expect(topId("headline", state)).toMatch(/headline_problem/);
  });

  it("prefers authority headlines when evaluating", () => {
    const state = makeState({ intent_score: 0.45 }); // evaluating
    expect(topId("headline", state)).toMatch(/headline_authority/);
  });

  it("prefers action headlines when ready", () => {
    const state = makeState({ intent_score: 0.7 }); // ready
    expect(topId("headline", state)).toMatch(/headline_action/);
  });

  it("applies _b variant penalty", () => {
    const state = makeState({ intent_score: 0.2 }); // exploring → problem
    const scoreA = scoreOf("headline", "headline_problem_a", state);
    const scoreB = scoreOf("headline", "headline_problem_b", state);
    expect(scoreA).toBeGreaterThan(scoreB);
    expect(scoreA - scoreB).toBeCloseTo(0.02, 2);
  });

  it("all headline scores are between 0 and 1", () => {
    const states = [
      makeState({ intent_score: 0.1 }),
      makeState({ intent_score: 0.5 }),
      makeState({ intent_score: 0.9 }),
    ];
    for (const s of states) {
      const result = scoreHeroDeterministic(s, matrix);
      for (const score of result.scores.headline) {
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ── Descriptions ─────────────────────────────────────────────

describe("description scoring", () => {
  it("prefers medium descriptions when high energy", () => {
    const state = makeState({ energy_score: 0.6 }); // high
    expect(topId("description", state)).toMatch(/desc_medium/);
  });

  it("prefers short descriptions when low energy", () => {
    const state = makeState({ energy_score: 0.3 }); // low
    expect(topId("description", state)).toMatch(/desc_short/);
  });

  it("medium vs short boundary at 0.45", () => {
    const low = makeState({ energy_score: 0.44 });
    const high = makeState({ energy_score: 0.45 });
    expect(topId("description", low)).toMatch(/desc_short/);
    expect(topId("description", high)).toMatch(/desc_medium/);
  });
});

// ── CTA ──────────────────────────────────────────────────────

describe("CTA scoring", () => {
  it("prefers direct CTA for high trust + evaluating", () => {
    const state = makeState({ intent_score: 0.5, trust_score: 0.6 });
    expect(topId("cta", state)).toBe("cta_direct_a");
  });

  it("prefers direct CTA for medium trust + ready", () => {
    const state = makeState({ intent_score: 0.7, trust_score: 0.4 });
    expect(topId("cta", state)).toBe("cta_direct_a");
  });

  it("prefers guided CTA for low trust", () => {
    const state = makeState({ trust_score: 0.2 });
    expect(topId("cta", state)).toBe("cta_guided_a");
  });

  it("caps direct CTA at 0.25 when exploring", () => {
    const state = makeState({ intent_score: 0.2 }); // exploring
    const directScore = scoreOf("cta", "cta_direct_a", state);
    expect(directScore).toBeLessThanOrEqual(0.25);
  });

  it("ensures guided >= 0.75 when exploring", () => {
    const state = makeState({ intent_score: 0.2 }); // exploring
    const guidedScore = scoreOf("cta", "cta_guided_a", state);
    expect(guidedScore).toBeGreaterThanOrEqual(0.75);
  });

  it("low trust gives soft > direct", () => {
    const state = makeState({ trust_score: 0.2, intent_score: 0.5 });
    const soft = scoreOf("cta", "cta_soft_a", state);
    const direct = scoreOf("cta", "cta_direct_a", state);
    expect(soft).toBeGreaterThan(direct);
  });
});

// ── Proof ────────────────────────────────────────────────────

describe("proof scoring", () => {
  it("prefers showreel_kpi for new users (familiarity < 0.3)", () => {
    const state = makeState({ familiarity_score: 0.0 });
    expect(topId("proof", state)).toBe("proof_showreel_kpi_a");
    expect(scoreOf("proof", "proof_showreel_kpi_a", state)).toBe(0.9);
  });

  it("prefers showreel for low trust + familiar users", () => {
    const state = makeState({ trust_score: 0.2, familiarity_score: 0.5 });
    expect(topId("proof", state)).toBe("proof_showreel_a");
    expect(scoreOf("proof", "proof_showreel_a", state)).toBe(0.8);
  });

  it("prefers kpi for high trust + evaluating (familiar user)", () => {
    const state = makeState({ trust_score: 0.6, intent_score: 0.5, familiarity_score: 0.5 });
    expect(topId("proof", state)).toBe("proof_kpi_a");
    expect(scoreOf("proof", "proof_kpi_a", state)).toBe(0.8);
  });

  it("prefers argument for evaluating + medium trust (familiar user)", () => {
    const state = makeState({ intent_score: 0.5, trust_score: 0.4, familiarity_score: 0.5 });
    expect(topId("proof", state)).toBe("proof_argument_a");
    expect(scoreOf("proof", "proof_argument_a", state)).toBe(0.7);
  });

  it("prefers none for low energy", () => {
    const state = makeState({ energy_score: 0.3, familiarity_score: 0.5 });
    const noneScore = scoreOf("proof", "proof_none", state);
    expect(noneScore).toBeGreaterThanOrEqual(0.75);
  });

  it("caps showreel at 0.3 for low energy", () => {
    const state = makeState({ energy_score: 0.3, familiarity_score: 0.5 });
    const showreelScore = scoreOf("proof", "proof_showreel_a", state);
    expect(showreelScore).toBeLessThanOrEqual(0.3);
  });

  it("new user + low energy: showreel_kpi capped, none still wins", () => {
    const state = makeState({ familiarity_score: 0.0, energy_score: 0.3 });
    // showreel_kpi starts at 0.9, capped to 0.35 by low energy
    // none boosted to 0.75
    expect(scoreOf("proof", "proof_showreel_kpi_a", state)).toBeLessThanOrEqual(0.35);
    expect(topId("proof", state)).toBe("proof_none");
  });
});

// ── Result Structure ─────────────────────────────────────────

describe("scoreHeroDeterministic result", () => {
  it("returns all 4 slots", () => {
    const result = scoreHeroDeterministic(makeState(), matrix);
    expect(Object.keys(result.scores)).toEqual(
      expect.arrayContaining(["headline", "description", "cta", "proof"])
    );
  });

  it("model is 'deterministic'", () => {
    const result = scoreHeroDeterministic(makeState(), matrix);
    expect(result.model).toBe("deterministic");
  });

  it("all scores have reason 'deterministic'", () => {
    const result = scoreHeroDeterministic(makeState(), matrix);
    for (const slot of Object.values(result.scores)) {
      for (const s of slot) {
        expect(s.reason).toBe("deterministic");
      }
    }
  });

  it("latency_ms is a non-negative number", () => {
    const result = scoreHeroDeterministic(makeState(), matrix);
    expect(result.latency_ms).toBeGreaterThanOrEqual(0);
  });
});
