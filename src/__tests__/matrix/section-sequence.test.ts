import { describe, it, expect } from "vitest";
import {
  resolveSectionSequence,
  SECTION_SEQUENCE_CONFIG,
} from "@/lib/matrix/section-sequence";
import { makeState } from "../helpers";

// ── Exploring ──────────────────────────────────────────────

describe("exploring section sequences", () => {
  const exploringState = (overrides = {}) =>
    makeState({ intent_score: 0.2, ...overrides });

  it("returns default for medium trust, high energy, non-returning", () => {
    const state = exploringState({ trust_score: 0.4, energy_score: 0.6 });
    expect(resolveSectionSequence(state, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.exploring.default
    );
  });

  it("returns returning override when isReturning (highest priority)", () => {
    const state = exploringState({ trust_score: 0.4, energy_score: 0.6 });
    expect(resolveSectionSequence(state, true)).toEqual(
      SECTION_SEQUENCE_CONFIG.exploring.overrides.returning
    );
  });

  it("returning takes priority over low_energy", () => {
    const state = exploringState({ energy_score: 0.3 }); // low energy
    const result = resolveSectionSequence(state, true);
    expect(result).toEqual(SECTION_SEQUENCE_CONFIG.exploring.overrides.returning);
  });

  it("returns low_energy override when energy < 0.35", () => {
    const state = exploringState({ trust_score: 0.4, energy_score: 0.3 });
    expect(resolveSectionSequence(state, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.exploring.overrides.low_energy
    );
  });

  it("low_energy takes priority over low_trust", () => {
    const state = exploringState({ trust_score: 0.2, energy_score: 0.3 });
    expect(resolveSectionSequence(state, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.exploring.overrides.low_energy
    );
  });

  it("returns low_trust override when trust < 0.35 and energy high", () => {
    const state = exploringState({ trust_score: 0.2, energy_score: 0.6 });
    expect(resolveSectionSequence(state, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.exploring.overrides.low_trust
    );
  });

  it("returns high_trust override when trust >= 0.5 and energy high", () => {
    const state = exploringState({ trust_score: 0.6, energy_score: 0.6 });
    expect(resolveSectionSequence(state, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.exploring.overrides.high_trust
    );
  });
});

// ── Evaluating ─────────────────────────────────────────────

describe("evaluating section sequences", () => {
  const evalState = (overrides = {}) =>
    makeState({ intent_score: 0.5, ...overrides });

  it("returns default for medium trust, high energy", () => {
    const state = evalState({ trust_score: 0.4, energy_score: 0.6 });
    expect(resolveSectionSequence(state, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.evaluating.default
    );
  });

  it("returns returning override with business_model", () => {
    const state = evalState({ trust_score: 0.4, energy_score: 0.6 });
    const result = resolveSectionSequence(state, true);
    expect(result).toContain("business_model");
    expect(result).toEqual(SECTION_SEQUENCE_CONFIG.evaluating.overrides.returning);
  });

  it("returns low_energy override (shorter)", () => {
    const state = evalState({ trust_score: 0.4, energy_score: 0.3 });
    const result = resolveSectionSequence(state, false);
    expect(result).toEqual(SECTION_SEQUENCE_CONFIG.evaluating.overrides.low_energy);
    expect(result.length).toBeLessThan(
      SECTION_SEQUENCE_CONFIG.evaluating.default.length
    );
  });

  it("returns low_trust override with proof_argument", () => {
    const state = evalState({ trust_score: 0.2, energy_score: 0.6 });
    const result = resolveSectionSequence(state, false);
    expect(result).toContain("proof_argument");
    expect(result).toContain("cta_soft"); // not cta_direct
  });

  it("returns high_trust override with proof_kpi", () => {
    const state = evalState({ trust_score: 0.6, energy_score: 0.6 });
    const result = resolveSectionSequence(state, false);
    expect(result).toContain("proof_kpi");
    expect(result).toContain("cta_direct");
  });
});

// ── Ready ──────────────────────────────────────────────────

describe("ready section sequences", () => {
  const readyState = (overrides = {}) =>
    makeState({ intent_score: 0.7, ...overrides });

  it("returns default with proof_optional", () => {
    const state = readyState({ trust_score: 0.4, energy_score: 0.6 });
    expect(resolveSectionSequence(state, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.ready.default
    );
  });

  it("returns returning override (minimal)", () => {
    const state = readyState({ trust_score: 0.4, energy_score: 0.6 });
    const result = resolveSectionSequence(state, true);
    expect(result).toEqual(["business_model", "cta_direct"]);
  });

  it("returns low_trust override with proof_showreel first", () => {
    const state = readyState({ trust_score: 0.2, energy_score: 0.6 });
    const result = resolveSectionSequence(state, false);
    expect(result[0]).toBe("proof_showreel");
  });

  it("returns high_trust override with proof_kpi", () => {
    const state = readyState({ trust_score: 0.6, energy_score: 0.6 });
    const result = resolveSectionSequence(state, false);
    expect(result).toContain("proof_kpi");
  });

  it("returns low_energy override (shortest)", () => {
    const state = readyState({ trust_score: 0.4, energy_score: 0.3 });
    const result = resolveSectionSequence(state, false);
    expect(result).toEqual(["business_model", "cta_direct"]);
  });
});

// ── Override Priority ──────────────────────────────────────

describe("override priority chain", () => {
  it("returning > low_energy > low_trust > high_trust > default", () => {
    // All conditions true: returning + low_energy + low_trust
    const state = makeState({
      intent_score: 0.5,
      trust_score: 0.2,
      energy_score: 0.3,
    });

    // With returning = true → returning wins
    const withReturning = resolveSectionSequence(state, true);
    expect(withReturning).toEqual(
      SECTION_SEQUENCE_CONFIG.evaluating.overrides.returning
    );

    // Without returning → low_energy wins over low_trust
    const withoutReturning = resolveSectionSequence(state, false);
    expect(withoutReturning).toEqual(
      SECTION_SEQUENCE_CONFIG.evaluating.overrides.low_energy
    );
  });

  it("low_trust before high_trust (never both true)", () => {
    // trust < 0.35 → low, trust >= 0.5 → high — they're mutually exclusive
    const low = makeState({ intent_score: 0.5, trust_score: 0.2, energy_score: 0.6 });
    const high = makeState({ intent_score: 0.5, trust_score: 0.6, energy_score: 0.6 });

    expect(resolveSectionSequence(low, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.evaluating.overrides.low_trust
    );
    expect(resolveSectionSequence(high, false)).toEqual(
      SECTION_SEQUENCE_CONFIG.evaluating.overrides.high_trust
    );
  });
});

// ── Edge cases ─────────────────────────────────────────────

describe("section sequence edge cases", () => {
  it("all sections in config are valid SectionId values", () => {
    const VALID_IDS = new Set([
      "shift", "consequence", "market_shift", "position", "position_light",
      "working_model", "intervention_logic", "business_model",
      "proof_showreel", "proof_kpi", "proof_argument", "proof_optional",
      "cta_soft", "cta_direct",
    ]);

    for (const [, config] of Object.entries(SECTION_SEQUENCE_CONFIG)) {
      for (const id of config.default) {
        expect(VALID_IDS.has(id)).toBe(true);
      }
      for (const [, sequence] of Object.entries(config.overrides)) {
        if (sequence) {
          for (const id of sequence) {
            expect(VALID_IDS.has(id)).toBe(true);
          }
        }
      }
    }
  });

  it("every sequence ends with a CTA or proof_optional", () => {
    for (const [, config] of Object.entries(SECTION_SEQUENCE_CONFIG)) {
      const lastDefault = config.default[config.default.length - 1];
      expect(lastDefault).toMatch(/^(cta_|proof_optional)/);

      for (const [, sequence] of Object.entries(config.overrides)) {
        if (sequence) {
          const last = sequence[sequence.length - 1];
          expect(last).toMatch(/^(cta_|proof_optional)/);
        }
      }
    }
  });
});
