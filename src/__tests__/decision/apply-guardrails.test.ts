import { describe, it, expect } from "vitest";
import { applyHeroGuardrails, HERO_GUARDRAILS } from "@/lib/decision/apply-guardrails";
import { scoreHeroDeterministic } from "@/lib/decision/select-hero";
import { loadHeroMatrix } from "@/lib/matrix/hero-matrix";
import { makeState, makeDevice, makeMobile } from "../helpers";
import type { SlotScore } from "@/lib/decision/types";

const matrix = loadHeroMatrix("any");

function getScore(scores: Record<string, SlotScore[]>, slot: string, id: string): number {
  return scores[slot].find((s) => s.id === id)?.score ?? -1;
}

// ── mobile_force_short_desc ────────────────────────────────

describe("mobile_force_short_desc guardrail", () => {
  it("reduces medium descriptions on mobile", () => {
    const state = makeState({ energy_score: 0.6 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const mediumBefore = getScore(scoring.scores, "description", "desc_medium_a");

    const { scores } = applyHeroGuardrails(scoring.scores, state, makeMobile());
    const mediumAfter = getScore(scores, "description", "desc_medium_a");

    expect(mediumAfter).toBeLessThan(mediumBefore);
    expect(mediumAfter).toBeCloseTo(mediumBefore * 0.4, 5);
  });

  it("boosts short descriptions on mobile to at least 0.7", () => {
    const state = makeState({ energy_score: 0.6 }); // high energy → short starts low (0.35)
    const scoring = scoreHeroDeterministic(state, matrix);

    const { scores } = applyHeroGuardrails(scoring.scores, state, makeMobile());
    const shortAfter = getScore(scores, "description", "desc_short_a");
    expect(shortAfter).toBeGreaterThanOrEqual(0.7);
  });

  it("does not trigger on desktop", () => {
    const state = makeState({ energy_score: 0.6 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const { rules_applied } = applyHeroGuardrails(scoring.scores, state, makeDevice());
    expect(rules_applied).not.toContain("mobile_force_short_desc");
  });

  it("short desc wins over medium on mobile", () => {
    const state = makeState({ energy_score: 0.6 }); // normally medium wins
    const scoring = scoreHeroDeterministic(state, matrix);
    const { scores } = applyHeroGuardrails(scoring.scores, state, makeMobile());

    const short = Math.max(
      getScore(scores, "description", "desc_short_a"),
      getScore(scores, "description", "desc_short_b")
    );
    const medium = Math.max(
      getScore(scores, "description", "desc_medium_a"),
      getScore(scores, "description", "desc_medium_b")
    );
    expect(short).toBeGreaterThan(medium);
  });
});

// ── mobile_avoid_heavy_proof ───────────────────────────────

describe("mobile_avoid_heavy_proof guardrail", () => {
  it("boosts proof_none to >= 0.7 on mobile", () => {
    const state = makeState({ familiarity_score: 0.0 }); // new user
    const scoring = scoreHeroDeterministic(state, matrix);

    const { scores } = applyHeroGuardrails(scoring.scores, state, makeMobile());
    expect(getScore(scores, "proof", "proof_none")).toBeGreaterThanOrEqual(0.7);
  });

  it("reduces showreel by 0.5x on mobile", () => {
    const state = makeState({ trust_score: 0.2, familiarity_score: 0.5 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const before = getScore(scoring.scores, "proof", "proof_showreel_a");

    const { scores } = applyHeroGuardrails(scoring.scores, state, makeMobile());
    const after = getScore(scores, "proof", "proof_showreel_a");
    expect(after).toBeCloseTo(before * 0.5, 5);
  });

  it("reduces showreel_kpi by 0.4x on mobile", () => {
    const state = makeState({ familiarity_score: 0.0 }); // showreel_kpi = 0.9
    const scoring = scoreHeroDeterministic(state, matrix);
    const before = getScore(scoring.scores, "proof", "proof_showreel_kpi_a");

    const { scores } = applyHeroGuardrails(scoring.scores, state, makeMobile());
    const after = getScore(scores, "proof", "proof_showreel_kpi_a");
    expect(after).toBeCloseTo(before * 0.4, 5);
  });

  it("leaves proof_argument_a untouched on mobile", () => {
    const state = makeState();
    const scoring = scoreHeroDeterministic(state, matrix);
    const before = getScore(scoring.scores, "proof", "proof_argument_a");

    const { scores } = applyHeroGuardrails(scoring.scores, state, makeMobile());
    const after = getScore(scores, "proof", "proof_argument_a");
    expect(after).toBe(before);
  });

  it("does not trigger on desktop", () => {
    const state = makeState();
    const scoring = scoreHeroDeterministic(state, matrix);
    const { rules_applied } = applyHeroGuardrails(scoring.scores, state, makeDevice());
    expect(rules_applied).not.toContain("mobile_avoid_heavy_proof");
  });
});

// ── low_energy_no_proof ────────────────────────────────────

describe("low_energy_no_proof guardrail", () => {
  it("triggers when energy < 0.35", () => {
    const state = makeState({ energy_score: 0.3 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const { rules_applied } = applyHeroGuardrails(scoring.scores, state, makeDevice());
    expect(rules_applied).toContain("low_energy_no_proof");
  });

  it("does not trigger at energy 0.35", () => {
    const state = makeState({ energy_score: 0.35 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const { rules_applied } = applyHeroGuardrails(scoring.scores, state, makeDevice());
    expect(rules_applied).not.toContain("low_energy_no_proof");
  });

  it("boosts proof_none to >= 0.85", () => {
    const state = makeState({ energy_score: 0.2 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const { scores } = applyHeroGuardrails(scoring.scores, state, makeDevice());
    expect(getScore(scores, "proof", "proof_none")).toBeGreaterThanOrEqual(0.85);
  });

  it("reduces all other proofs by 0.5x", () => {
    const state = makeState({ energy_score: 0.2, familiarity_score: 0.5 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const argBefore = getScore(scoring.scores, "proof", "proof_argument_a");

    const { scores } = applyHeroGuardrails(scoring.scores, state, makeDevice());
    const argAfter = getScore(scores, "proof", "proof_argument_a");
    expect(argAfter).toBeCloseTo(argBefore * 0.5, 5);
  });

  it("proof_none wins when energy very low", () => {
    const state = makeState({ energy_score: 0.2 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const { scores } = applyHeroGuardrails(scoring.scores, state, makeDevice());

    const noneScore = getScore(scores, "proof", "proof_none");
    const others = scores.proof.filter((s) => s.id !== "proof_none");
    for (const s of others) {
      expect(noneScore).toBeGreaterThan(s.score);
    }
  });
});

// ── Rule counting ──────────────────────────────────────────

describe("guardrail rules_applied tracking", () => {
  it("returns empty array for desktop + normal energy", () => {
    const state = makeState({ energy_score: 0.6 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const { rules_applied } = applyHeroGuardrails(scoring.scores, state, makeDevice());
    expect(rules_applied).toEqual([]);
  });

  it("returns both mobile rules on mobile", () => {
    const state = makeState({ energy_score: 0.6 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const { rules_applied } = applyHeroGuardrails(scoring.scores, state, makeMobile());
    expect(rules_applied).toContain("mobile_force_short_desc");
    expect(rules_applied).toContain("mobile_avoid_heavy_proof");
    expect(rules_applied).toHaveLength(2);
  });

  it("returns all 3 rules for mobile + very low energy", () => {
    const state = makeState({ energy_score: 0.2 });
    const scoring = scoreHeroDeterministic(state, matrix);
    const { rules_applied } = applyHeroGuardrails(scoring.scores, state, makeMobile());
    expect(rules_applied).toHaveLength(3);
  });

  it("has exactly 3 guardrail rules defined", () => {
    expect(HERO_GUARDRAILS).toHaveLength(3);
  });
});
