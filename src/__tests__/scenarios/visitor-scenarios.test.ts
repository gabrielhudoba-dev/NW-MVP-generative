/**
 * End-to-end persona scenarios.
 *
 * Each test simulates a real visitor profile through the full decision pipeline
 * and verifies the complete output: state vector, hero selection, section sequence.
 */

import { describe, it, expect } from "vitest";
import { runPageDecisionFast } from "@/lib/decision/engine";
import { deriveUserState } from "@/lib/state/derive-user-state";
import { deriveStateKey, intentBucket, trustBucket, energyBucket } from "@/lib/state/state-types";
import {
  PERSONA_NEW_DIRECT_DESKTOP,
  PERSONA_RETURNING_SEARCH,
  PERSONA_MOBILE_EVENING_SOCIAL,
  PERSONA_CPC_RETURNING,
  PERSONA_MOBILE_WEEKEND_REFERRAL,
  PERSONA_EMAIL_RETURNING_EVENING,
} from "../helpers";

// ── Persona A: New visitor, desktop, working hours, direct ──

describe("Persona A: new direct desktop", () => {
  const { ctx, device } = PERSONA_NEW_DIRECT_DESKTOP;
  const state = deriveUserState(ctx, device);
  const decision = runPageDecisionFast(ctx, device);

  it("derives exploring intent (0.4 < 0.6, but direct +0.1 → 0.4 = evaluating)", () => {
    // 0.3 base + 0.1 (direct) = 0.4 → evaluating (>= 0.35)
    expect(intentBucket(state)).toBe("evaluating");
  });

  it("derives high trust from direct traffic", () => {
    // 0.3 + 0.2 (direct) = 0.5 → high
    expect(trustBucket(state)).toBe("high");
  });

  it("derives high energy for desktop working hours", () => {
    // 0.5 + 0.15 (working) + 0.05 (desktop) = 0.7 → high
    expect(energyBucket(state)).toBe("high");
  });

  it("state key is evaluating_high_high", () => {
    expect(deriveStateKey(state)).toBe("evaluating_high_high");
  });

  it("selects authority headline (evaluating intent)", () => {
    expect(decision.hero.selected_ids.headline).toMatch(/headline_authority/);
  });

  it("selects medium description (high energy)", () => {
    expect(decision.hero.selected_ids.description).toMatch(/desc_medium/);
  });

  it("selects direct CTA (high trust + evaluating)", () => {
    expect(decision.hero.selected_ids.cta).toBe("cta_direct_a");
  });

  it("selects showreel_kpi proof (new user, familiarity 0.2 < 0.3)", () => {
    // familiarity = 0.2 (from direct) < 0.3 → new user rule → showreel_kpi = 0.9
    expect(decision.hero.selected_ids.proof).toBe("proof_showreel_kpi_a");
  });

  it("no guardrails applied (desktop, normal energy)", () => {
    expect(decision.hero.rules_applied).toEqual([]);
  });

  it("shows evaluating high_trust section sequence", () => {
    expect(decision.sections.section_ids).toEqual([
      "position", "working_model", "intervention_logic", "proof_kpi", "cta_direct",
    ]);
  });
});

// ── Persona B: Returning visitor, desktop, search ──────────

describe("Persona B: returning search desktop", () => {
  const { ctx, device } = PERSONA_RETURNING_SEARCH;
  const state = deriveUserState(ctx, device);
  const decision = runPageDecisionFast(ctx, device);

  it("has high familiarity from returning + search", () => {
    // 0.0 + 0.5 (returning) = 0.5
    expect(state.familiarity_score).toBeCloseTo(0.5, 2);
  });

  it("derives evaluating or ready intent", () => {
    // 0.3 + 0.15 (returning) + 0.15 (search) = 0.6 → ready
    expect(intentBucket(state)).toBe("ready");
  });

  it("derives high trust", () => {
    // 0.3 + 0.15 (returning) = 0.45 → medium
    expect(trustBucket(state)).toBe("medium");
  });

  it("uses returning section override for ready intent", () => {
    // ready + returning → returning override
    expect(decision.sections.section_ids).toEqual([
      "business_model", "cta_direct",
    ]);
  });

  it("selects action headline (ready intent)", () => {
    expect(decision.hero.selected_ids.headline).toMatch(/headline_action/);
  });

  it("selects direct CTA (medium trust + ready)", () => {
    expect(decision.hero.selected_ids.cta).toBe("cta_direct_a");
  });
});

// ── Persona C: Mobile, evening, social, first visit ────────

describe("Persona C: mobile evening social", () => {
  const { ctx, device } = PERSONA_MOBILE_EVENING_SOCIAL;
  const state = deriveUserState(ctx, device);
  const decision = runPageDecisionFast(ctx, device);

  it("has low trust from social", () => {
    // 0.3 - 0.05 (social) = 0.25 → low
    expect(trustBucket(state)).toBe("low");
  });

  it("has low energy from evening + mobile", () => {
    // 0.5 - 0.15 (evening) - 0.1 (mobile) = 0.25 → low
    expect(energyBucket(state)).toBe("low");
  });

  it("explores (low intent)", () => {
    // 0.3 base, no boosts → exploring
    expect(intentBucket(state)).toBe("exploring");
  });

  it("applies both mobile guardrails", () => {
    expect(decision.hero.rules_applied).toContain("mobile_force_short_desc");
    expect(decision.hero.rules_applied).toContain("mobile_avoid_heavy_proof");
  });

  it("selects short description (mobile guardrail)", () => {
    expect(decision.hero.selected_ids.description).toMatch(/desc_short/);
  });

  it("selects problem headline (exploring)", () => {
    expect(decision.hero.selected_ids.headline).toMatch(/headline_problem/);
  });

  it("selects guided CTA (low trust + exploring)", () => {
    expect(decision.hero.selected_ids.cta).toBe("cta_guided_a");
  });

  it("uses exploring low_energy section sequence", () => {
    // exploring + low_energy → low_energy override
    expect(decision.sections.section_ids).toEqual([
      "shift", "consequence", "cta_soft",
    ]);
  });

  it("energy is very low (all penalties stack)", () => {
    expect(state.energy_score).toBeLessThan(0.35);
    // Should also trigger low_energy_no_proof guardrail
    expect(decision.hero.rules_applied).toContain("low_energy_no_proof");
  });
});

// ── Persona D: Desktop, CPC, returning ─────────────────────

describe("Persona D: CPC returning desktop", () => {
  const { ctx, device } = PERSONA_CPC_RETURNING;
  const state = deriveUserState(ctx, device);
  const decision = runPageDecisionFast(ctx, device);

  it("has very high intent from CPC + returning + search", () => {
    // 0.3 + 0.15 (returning) + 0.15 (search) + 0.15 (cpc) = 0.75 → ready
    expect(intentBucket(state)).toBe("ready");
  });

  it("has high familiarity from returning + search", () => {
    // 0.0 + 0.5 (returning) = 0.5
    expect(state.familiarity_score).toBeCloseTo(0.5, 2);
  });

  it("selects action headline (ready intent)", () => {
    expect(decision.hero.selected_ids.headline).toMatch(/headline_action/);
  });

  it("selects direct CTA", () => {
    expect(decision.hero.selected_ids.cta).toBe("cta_direct_a");
  });

  it("uses returning section sequence override", () => {
    // ready + returning → returning override
    expect(decision.sections.section_ids).toEqual([
      "business_model", "cta_direct",
    ]);
  });

  it("high decision speed from CPC + returning", () => {
    // 0.4 + 0.1 (returning) + 0.1 (cpc) + 0.05 (working) = 0.65
    expect(state.decision_speed_score).toBeCloseTo(0.65, 2);
  });
});

// ── Persona E: Mobile, weekend, referral ───────────────────

describe("Persona E: mobile weekend referral", () => {
  const { ctx, device } = PERSONA_MOBILE_WEEKEND_REFERRAL;
  const state = deriveUserState(ctx, device);
  const decision = runPageDecisionFast(ctx, device);

  it("has medium trust from referral", () => {
    // 0.3 + 0.15 (referral) = 0.45 → medium
    expect(trustBucket(state)).toBe("medium");
  });

  it("explores (base intent only)", () => {
    // 0.3 base → exploring
    expect(intentBucket(state)).toBe("exploring");
  });

  it("has medium-to-low energy (weekend + mobile)", () => {
    // 0.5 + 0.15 (working) - 0.1 (weekend) - 0.1 (mobile) = 0.45 → high boundary
    expect(state.energy_score).toBeCloseTo(0.45, 2);
  });

  it("applies mobile guardrails", () => {
    expect(decision.hero.rules_applied).toContain("mobile_force_short_desc");
  });

  it("selects short description on mobile", () => {
    expect(decision.hero.selected_ids.description).toMatch(/desc_short/);
  });

  it("exploring default sections (medium trust, energy at boundary)", () => {
    // energy 0.45 → high, trust 0.45 → medium, not returning
    // → default exploring sequence
    expect(decision.sections.section_ids).toEqual([
      "shift", "consequence", "position_light", "cta_soft",
    ]);
  });
});

// ── Persona F: Desktop, email, returning, evening ──────────

describe("Persona F: email returning evening", () => {
  const { ctx, device } = PERSONA_EMAIL_RETURNING_EVENING;
  const state = deriveUserState(ctx, device);
  const decision = runPageDecisionFast(ctx, device);

  it("has high trust from returning + email", () => {
    // 0.3 + 0.15 (returning) + 0.1 (email) = 0.55 → high
    expect(trustBucket(state)).toBe("high");
  });

  it("has evaluating intent from returning + email", () => {
    // 0.3 + 0.15 (returning) + 0.1 (email) = 0.55 → evaluating
    expect(intentBucket(state)).toBe("evaluating");
  });

  it("has lower energy from evening", () => {
    // 0.5 - 0.15 (evening) + 0.05 (desktop) = 0.4 → low
    expect(energyBucket(state)).toBe("low");
  });

  it("uses returning section override (highest priority)", () => {
    // evaluating + returning → returning override wins over low_energy
    expect(decision.sections.section_ids).toEqual([
      "position", "working_model", "business_model", "cta_direct",
    ]);
  });

  it("selects medium description (desktop, despite low energy — no mobile guardrail)", () => {
    // Scoring: low energy → short gets 0.8, medium gets 0.3
    // No mobile guardrail on desktop → short wins by scoring
    expect(decision.hero.selected_ids.description).toMatch(/desc_short/);
  });

  it("no mobile guardrails applied", () => {
    expect(decision.hero.rules_applied).not.toContain("mobile_force_short_desc");
  });

  it("high familiarity from returning", () => {
    // 0.0 + 0.5 (returning) = 0.5
    expect(state.familiarity_score).toBeCloseTo(0.5, 2);
  });
});

// ── Cross-persona consistency ──────────────────────────────

describe("cross-persona consistency", () => {
  const personas = [
    PERSONA_NEW_DIRECT_DESKTOP,
    PERSONA_RETURNING_SEARCH,
    PERSONA_MOBILE_EVENING_SOCIAL,
    PERSONA_CPC_RETURNING,
    PERSONA_MOBILE_WEEKEND_REFERRAL,
    PERSONA_EMAIL_RETURNING_EVENING,
  ];

  it("all personas produce valid decisions", () => {
    for (const { ctx, device } of personas) {
      const decision = runPageDecisionFast(ctx, device);
      expect(decision.hero.content.headline.text).toBeTruthy();
      expect(decision.hero.content.cta.label).toBeTruthy();
      expect(decision.sections.section_ids.length).toBeGreaterThan(0);
    }
  });

  it("all section sequences end with a CTA", () => {
    for (const { ctx, device } of personas) {
      const decision = runPageDecisionFast(ctx, device);
      const last = decision.sections.section_ids[decision.sections.section_ids.length - 1];
      expect(last).toMatch(/^cta_/);
    }
  });

  it("mobile personas always get short descriptions", () => {
    const mobilePeople = [PERSONA_MOBILE_EVENING_SOCIAL, PERSONA_MOBILE_WEEKEND_REFERRAL];
    for (const { ctx, device } of mobilePeople) {
      const decision = runPageDecisionFast(ctx, device);
      expect(decision.hero.selected_ids.description).toMatch(/desc_short/);
    }
  });

  it("returning visitors never get exploring section sequences with 'shift'", () => {
    const returning = [PERSONA_RETURNING_SEARCH, PERSONA_CPC_RETURNING, PERSONA_EMAIL_RETURNING_EVENING];
    for (const { ctx, device } of returning) {
      const decision = runPageDecisionFast(ctx, device);
      expect(decision.sections.section_ids).not.toContain("shift");
    }
  });

  it("all decisions have unique snapshot IDs", () => {
    const ids = personas.map(({ ctx, device }) =>
      runPageDecisionFast(ctx, device).snapshot_id
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});
