/**
 * End-to-end persona scenarios.
 *
 * Each test runs a persona through the full decision pipeline and verifies
 * the flat PageDecision output. In test env (Node, no localStorage) the engine
 * always uses the cold-start preset path.
 *
 * Preset selection rules (from variant-config.ts PRESETS):
 *   1. intent < 0.40 && trust < 0.35 → problem_authority / short_operator / argument / see_how_it_works
 *   2. intent < 0.40 && trust >= 0.35 → clarity_speed / medium_authority / showreel_kpi / review_my_product
 *   3. intent >= 0.40 && < 0.70 && trust < 0.35 → quality_under_change / medium_outcome / argument / review_my_product
 *   4. intent >= 0.40 && < 0.70 && trust >= 0.35 → digital_product_authority / medium_authority / kpi / book_diagnostic
 *   5. intent >= 0.70 && trust >= 0.55 → digital_product_authority / medium_outcome / showreel_kpi / book_call_direct
 */
import { describe, it, expect } from "vitest";
import { runPageDecision } from "@/lib/decision/engine";
import { deriveUserState } from "@/lib/state/derive-user-state";
import { intentBucket, trustBucket, energyBucket, deriveStateKey } from "@/lib/state/state-types";
import {
  PERSONA_NEW_DIRECT_DESKTOP,
  PERSONA_RETURNING_SEARCH,
  PERSONA_MOBILE_EVENING_SOCIAL,
  PERSONA_CPC_RETURNING,
  PERSONA_MOBILE_WEEKEND_REFERRAL,
  PERSONA_EMAIL_RETURNING_EVENING,
} from "../helpers";

// ── Shared assertions ──────────────────────────────────────────

function assertValidDecision(ctx: typeof PERSONA_NEW_DIRECT_DESKTOP.ctx, device: typeof PERSONA_NEW_DIRECT_DESKTOP.device) {
  const d = runPageDecision(ctx, device);
  expect(d.content).toBeDefined();
  expect(d.content.headline.text.length).toBeGreaterThan(0);
  expect(d.content.description.text.length).toBeGreaterThan(0);
  expect(d.content.cta.label.length).toBeGreaterThan(0);
  expect(d.sections.length).toBeGreaterThan(0);
  expect(d.state_key).toMatch(/^(exploring|evaluating|ready)_(low|medium|high)_(low|medium|high)$/);
  expect(d.decision_mode).toBe("preset");
  return d;
}

// ── Persona A: New visitor, desktop, working hours, direct ──────

describe("Persona A: new direct desktop", () => {
  const { ctx, device } = PERSONA_NEW_DIRECT_DESKTOP;
  // State: intent=0.38, trust=0.46, energy=0.65
  // → exploring (0.38 < 0.40), medium (0.35 ≤ 0.46 < 0.60), high (0.65 ≥ 0.65)

  it("derives exploring intent (0.38 < 0.40)", () => {
    const state = deriveUserState(ctx, device);
    expect(intentBucket(state)).toBe("exploring");
  });

  it("derives medium trust from direct traffic (0.46)", () => {
    const state = deriveUserState(ctx, device);
    expect(trustBucket(state)).toBe("medium");
  });

  it("derives high energy for desktop working hours (0.65)", () => {
    const state = deriveUserState(ctx, device);
    expect(energyBucket(state)).toBe("high");
  });

  it("state key is exploring_medium_high", () => {
    const state = deriveUserState(ctx, device);
    expect(deriveStateKey(state)).toBe("exploring_medium_high");
  });

  it("uses preset 2: clarity_speed / medium_authority", () => {
    // intent < 0.40 && trust >= 0.35 → preset 2
    const d = runPageDecision(ctx, device);
    expect(d.hero_variant).toBe("clarity_speed");
    expect(d.description_variant).toBe("medium_authority");
    expect(d.proof_variant).toBe("showreel_kpi");
    expect(d.cta_variant).toBe("review_my_product");
  });

  it("returns valid decision", () => {
    assertValidDecision(ctx, device);
  });
});

// ── Persona B: Returning visitor, desktop, search ──────────────

describe("Persona B: returning search desktop", () => {
  const { ctx, device } = PERSONA_RETURNING_SEARCH;
  // returning: intent+0.12, trust+0.12; search: intent+0.14, energy+0.08, attention+0.08
  // State: intent=0.30+0.12+0.14=0.56, trust=0.30+0.12=0.42
  // → evaluating (0.56 ≥ 0.40), medium (0.42 ≥ 0.35), high (0.65+0.08=0.73)

  it("derives evaluating intent (returning + search boost)", () => {
    const state = deriveUserState(ctx, device);
    expect(intentBucket(state)).toBe("evaluating");
  });

  it("derives medium trust", () => {
    const state = deriveUserState(ctx, device);
    expect(trustBucket(state)).toBe("medium");
  });

  it("uses preset 4: digital_product_authority / medium_authority / kpi / book_diagnostic", () => {
    // intent >= 0.40 && < 0.70 && trust >= 0.35 → preset 4
    const d = runPageDecision(ctx, device);
    expect(d.hero_variant).toBe("digital_product_authority");
    expect(d.cta_variant).toBe("book_diagnostic");
    expect(d.proof_variant).toBe("kpi");
  });

  it("returns valid decision", () => {
    assertValidDecision(ctx, device);
  });
});

// ── Persona C: Mobile, evening, social, first visit ─────────────

describe("Persona C: mobile evening social", () => {
  const { ctx, device } = PERSONA_MOBILE_EVENING_SOCIAL;
  // social: trust-0.04; evening: energy-0.08; mobile: energy-0.10
  // State: intent=0.30, trust=0.26, energy=0.32
  // → exploring, low trust (0.26 < 0.35), low energy (0.32 < 0.35)

  it("derives exploring intent (no positive acquisition signal)", () => {
    const state = deriveUserState(ctx, device);
    expect(intentBucket(state)).toBe("exploring");
  });

  it("derives low trust (social penalty)", () => {
    const state = deriveUserState(ctx, device);
    expect(trustBucket(state)).toBe("low");
  });

  it("state key is exploring_low_low", () => {
    const state = deriveUserState(ctx, device);
    expect(deriveStateKey(state)).toBe("exploring_low_low");
  });

  it("uses preset 1: problem_authority / short_operator / argument / see_how_it_works", () => {
    // intent < 0.40 && trust < 0.35 → preset 1
    const d = runPageDecision(ctx, device);
    expect(d.hero_variant).toBe("problem_authority");
    expect(d.description_variant).toBe("short_operator");
    expect(d.cta_variant).toBe("see_how_it_works");
  });

  it("returns valid decision", () => {
    assertValidDecision(ctx, device);
  });
});

// ── Persona D: Desktop, CPC, returning ────────────────────────

describe("Persona D: CPC returning desktop", () => {
  const { ctx, device } = PERSONA_CPC_RETURNING;
  // returning: intent+0.12, trust+0.12; search: intent+0.14; cpc: intent+0.10
  // State: intent=0.30+0.12+0.14+0.10=0.66, trust=0.30+0.12=0.42
  // → evaluating (0.40 ≤ 0.66 < 0.70), medium trust

  it("derives evaluating intent (returning + search + cpc)", () => {
    const state = deriveUserState(ctx, device);
    expect(intentBucket(state)).toBe("evaluating");
  });

  it("derives medium trust", () => {
    const state = deriveUserState(ctx, device);
    expect(trustBucket(state)).toBe("medium");
  });

  it("uses preset 4: digital_product_authority / book_diagnostic", () => {
    // intent >= 0.40 && < 0.70 && trust >= 0.35 → preset 4
    const d = runPageDecision(ctx, device);
    expect(d.hero_variant).toBe("digital_product_authority");
    expect(d.cta_variant).toBe("book_diagnostic");
  });

  it("returns valid decision", () => {
    assertValidDecision(ctx, device);
  });
});

// ── Persona E: Mobile, weekend, referral ──────────────────────

describe("Persona E: mobile weekend referral", () => {
  const { ctx, device } = PERSONA_MOBILE_WEEKEND_REFERRAL;
  // referral: trust+0.14; weekend: intent-0.05
  // State: intent=0.30-0.05=0.25, trust=0.30+0.14=0.44
  // → exploring, medium trust

  it("derives exploring intent (weekend penalty reduces below 0.40)", () => {
    const state = deriveUserState(ctx, device);
    expect(intentBucket(state)).toBe("exploring");
  });

  it("derives medium trust (referral boost)", () => {
    const state = deriveUserState(ctx, device);
    expect(trustBucket(state)).toBe("medium");
  });

  it("uses preset 2: clarity_speed / review_my_product", () => {
    // intent < 0.40 && trust >= 0.35 → preset 2
    const d = runPageDecision(ctx, device);
    expect(d.hero_variant).toBe("clarity_speed");
    expect(d.cta_variant).toBe("review_my_product");
  });

  it("returns valid decision", () => {
    assertValidDecision(ctx, device);
  });
});

// ── Persona F: Desktop, email, returning, evening ─────────────

describe("Persona F: email returning evening", () => {
  const { ctx, device } = PERSONA_EMAIL_RETURNING_EVENING;
  // email: intent+0.10, trust+0.08; returning: intent+0.12, trust+0.12
  // State: intent=0.30+0.10+0.12=0.52, trust=0.30+0.08+0.12=0.50
  // → evaluating (0.40 ≤ 0.52 < 0.70), medium trust (0.35 ≤ 0.50 < 0.60)

  it("derives evaluating intent", () => {
    const state = deriveUserState(ctx, device);
    expect(intentBucket(state)).toBe("evaluating");
  });

  it("derives medium trust", () => {
    const state = deriveUserState(ctx, device);
    expect(trustBucket(state)).toBe("medium");
  });

  it("uses preset 4: digital_product_authority / book_diagnostic", () => {
    const d = runPageDecision(ctx, device);
    expect(d.hero_variant).toBe("digital_product_authority");
    expect(d.cta_variant).toBe("book_diagnostic");
  });

  it("returns valid decision", () => {
    assertValidDecision(ctx, device);
  });
});

// ── Cross-scenario invariants ──────────────────────────────────

describe("cross-scenario invariants", () => {
  const allPersonas = [
    PERSONA_NEW_DIRECT_DESKTOP,
    PERSONA_RETURNING_SEARCH,
    PERSONA_MOBILE_EVENING_SOCIAL,
    PERSONA_CPC_RETURNING,
    PERSONA_MOBILE_WEEKEND_REFERRAL,
    PERSONA_EMAIL_RETURNING_EVENING,
  ];

  it("all personas produce valid decisions without crashing", () => {
    for (const { ctx, device } of allPersonas) {
      const d = runPageDecision(ctx, device);
      expect(d.content).toBeDefined();
      expect(d.sections.length).toBeGreaterThan(0);
    }
  });

  it("all personas use preset mode (cold start)", () => {
    for (const { ctx, device } of allPersonas) {
      const d = runPageDecision(ctx, device);
      expect(d.decision_mode).toBe("preset");
    }
  });

  it("all persona decisions use new variant ID scheme", () => {
    for (const { ctx, device } of allPersonas) {
      const d = runPageDecision(ctx, device);
      expect(d.hero_variant).not.toMatch(/^headline_/);
      expect(d.description_variant).not.toMatch(/^desc_/);
      expect(d.cta_variant).not.toMatch(/^cta_/);
    }
  });
});
