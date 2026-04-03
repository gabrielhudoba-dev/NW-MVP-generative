import { describe, it, expect } from "vitest";
import {
  checkHeroCompatibility,
  checkSectionSequenceCoherence,
} from "@/lib/matrix/compatibility-rules";
import type { HeroContent } from "@/lib/content/content-types";
import { HEADLINES_MAP } from "@/lib/content/headlines";
import { DESCRIPTIONS_MAP } from "@/lib/content/descriptions";
import { CTAS_MAP } from "@/lib/content/ctas";
import { PROOFS_MAP } from "@/lib/content/proofs";

function makeHeroContent(overrides: {
  headline?: string;
  description?: string;
  cta?: string;
  proof?: string;
} = {}): HeroContent {
  return {
    headline: HEADLINES_MAP[overrides.headline ?? "headline_authority_a"],
    description: DESCRIPTIONS_MAP[overrides.description ?? "desc_medium_a"],
    cta: CTAS_MAP[overrides.cta ?? "cta_guided_a"],
    proof: PROOFS_MAP[overrides.proof ?? "proof_argument_a"],
  };
}

// ── Hero Compatibility ─────────────────────────────────────

describe("checkHeroCompatibility", () => {
  it("returns no violations for compatible combination", () => {
    const content = makeHeroContent();
    expect(checkHeroCompatibility(content)).toEqual([]);
  });

  it("detects action headline + soft CTA violation", () => {
    const content = makeHeroContent({
      headline: "headline_action_a",
      cta: "cta_soft_a",
    });
    const violations = checkHeroCompatibility(content);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("action_headline_no_soft_cta");
  });

  it("allows action headline + direct CTA", () => {
    const content = makeHeroContent({
      headline: "headline_action_a",
      cta: "cta_direct_a",
    });
    expect(checkHeroCompatibility(content)).toEqual([]);
  });

  it("allows action headline + guided CTA", () => {
    const content = makeHeroContent({
      headline: "headline_action_a",
      cta: "cta_guided_a",
    });
    expect(checkHeroCompatibility(content)).toEqual([]);
  });

  it("detects problem headline + direct CTA violation", () => {
    const content = makeHeroContent({
      headline: "headline_problem_a",
      cta: "cta_direct_a",
    });
    const violations = checkHeroCompatibility(content);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("problem_headline_no_direct_cta");
  });

  it("allows problem headline + guided CTA", () => {
    const content = makeHeroContent({
      headline: "headline_problem_a",
      cta: "cta_guided_a",
    });
    expect(checkHeroCompatibility(content)).toEqual([]);
  });

  it("detects short description + showreel_kpi violation", () => {
    const content = makeHeroContent({
      description: "desc_short_a",
      proof: "proof_showreel_kpi_a",
    });
    const violations = checkHeroCompatibility(content);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("short_desc_no_heavy_proof");
  });

  it("allows short description + kpi", () => {
    const content = makeHeroContent({
      description: "desc_short_a",
      proof: "proof_kpi_a",
    });
    expect(checkHeroCompatibility(content)).toEqual([]);
  });

  it("allows medium description + showreel_kpi", () => {
    const content = makeHeroContent({
      description: "desc_medium_a",
      proof: "proof_showreel_kpi_a",
    });
    expect(checkHeroCompatibility(content)).toEqual([]);
  });

  it("can detect multiple violations simultaneously", () => {
    const content = makeHeroContent({
      headline: "headline_problem_a",
      description: "desc_short_a",
      cta: "cta_direct_a",
      proof: "proof_showreel_kpi_a",
    });
    const violations = checkHeroCompatibility(content);
    expect(violations.length).toBeGreaterThanOrEqual(2);
    const rules = violations.map((v) => v.rule);
    expect(rules).toContain("problem_headline_no_direct_cta");
    expect(rules).toContain("short_desc_no_heavy_proof");
  });
});

// ── Section Sequence Coherence ─────────────────────────────

describe("checkSectionSequenceCoherence", () => {
  it("returns no violations for valid sequence", () => {
    expect(checkSectionSequenceCoherence([
      "shift", "consequence", "position_light", "cta_soft",
    ])).toEqual([]);
  });

  it("detects consecutive CTA sections", () => {
    const violations = checkSectionSequenceCoherence([
      "shift", "cta_soft", "cta_direct",
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("no_consecutive_ctas");
  });

  it("allows non-consecutive CTA sections", () => {
    expect(checkSectionSequenceCoherence([
      "cta_soft", "shift", "cta_direct",
    ])).toEqual([]);
  });

  it("detects more than 2 proof sections", () => {
    const violations = checkSectionSequenceCoherence([
      "proof_showreel", "proof_kpi", "proof_argument", "cta_direct",
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("max_two_proof_sections");
  });

  it("allows exactly 2 proof sections", () => {
    expect(checkSectionSequenceCoherence([
      "proof_showreel", "proof_kpi", "cta_direct",
    ])).toEqual([]);
  });

  it("allows 0 proof sections", () => {
    expect(checkSectionSequenceCoherence([
      "shift", "consequence", "cta_soft",
    ])).toEqual([]);
  });

  it("returns empty for empty sequence", () => {
    expect(checkSectionSequenceCoherence([])).toEqual([]);
  });

  it("can detect both violations at once", () => {
    const violations = checkSectionSequenceCoherence([
      "proof_showreel", "proof_kpi", "proof_argument",
      "cta_soft", "cta_direct",
    ]);
    expect(violations.length).toBe(2);
    const rules = violations.map((v) => v.rule);
    expect(rules).toContain("no_consecutive_ctas");
    expect(rules).toContain("max_two_proof_sections");
  });
});
