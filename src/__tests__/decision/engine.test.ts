import { describe, it, expect } from "vitest";
import { runPageDecisionFast } from "@/lib/decision/engine";
import { makeCtx, makeDevice, makeMobile } from "../helpers";

describe("runPageDecisionFast", () => {
  it("returns a complete PageDecision synchronously", () => {
    const decision = runPageDecisionFast(makeCtx(), makeDevice());

    // Structure
    expect(decision).toHaveProperty("hero");
    expect(decision).toHaveProperty("sections");
    expect(decision).toHaveProperty("snapshot_id");
    expect(decision).toHaveProperty("timestamp");
  });

  it("hero has all required fields", () => {
    const { hero } = runPageDecisionFast(makeCtx(), makeDevice());

    expect(hero.content).toBeDefined();
    expect(hero.content.headline).toBeDefined();
    expect(hero.content.description).toBeDefined();
    expect(hero.content.cta).toBeDefined();
    expect(hero.content.proof).toBeDefined();
    expect(hero.selected_ids).toBeDefined();
    expect(hero.state_vector).toBeDefined();
    expect(hero.state_key).toBeDefined();
    expect(hero.scoring).toBeDefined();
    expect(hero.selection_method).toBe("deterministic");
    expect(hero.rules_applied).toBeDefined();
    expect(hero.snapshot_id).toBeTruthy();
  });

  it("sections has all required fields", () => {
    const { sections } = runPageDecisionFast(makeCtx(), makeDevice());

    expect(sections.section_ids).toBeDefined();
    expect(sections.section_ids.length).toBeGreaterThan(0);
    expect(sections.state_vector).toBeDefined();
    expect(sections.state_key).toBeDefined();
    expect(sections.selection_method).toBe("deterministic");
    expect(sections.allowed_ids).toBeDefined();
  });

  it("snapshot_id matches across hero and sections", () => {
    const decision = runPageDecisionFast(makeCtx(), makeDevice());
    expect(decision.hero.snapshot_id).toBe(decision.snapshot_id);
    expect(decision.sections.snapshot_id).toBe(decision.snapshot_id);
  });

  it("generates unique snapshot IDs per call", () => {
    const d1 = runPageDecisionFast(makeCtx(), makeDevice());
    const d2 = runPageDecisionFast(makeCtx(), makeDevice());
    expect(d1.snapshot_id).not.toBe(d2.snapshot_id);
  });

  it("hero content has non-empty text values", () => {
    const { hero } = runPageDecisionFast(makeCtx(), makeDevice());
    expect(hero.content.headline.text.length).toBeGreaterThan(0);
    expect(hero.content.description.text.length).toBeGreaterThan(0);
    expect(hero.content.cta.label.length).toBeGreaterThan(0);
  });

  it("state vectors match between hero and sections", () => {
    const decision = runPageDecisionFast(makeCtx(), makeDevice());
    expect(decision.hero.state_vector).toEqual(decision.sections.state_vector);
    expect(decision.hero.state_key).toBe(decision.sections.state_key);
  });

  // ── Mobile guardrails propagate ──────────────────────────

  it("applies mobile guardrails", () => {
    const decision = runPageDecisionFast(makeCtx(), makeMobile());
    expect(decision.hero.rules_applied).toContain("mobile_force_short_desc");
    expect(decision.hero.rules_applied).toContain("mobile_avoid_heavy_proof");
  });

  it("selects short description on mobile", () => {
    const decision = runPageDecisionFast(makeCtx(), makeMobile());
    expect(decision.hero.selected_ids.description).toMatch(/desc_short/);
  });

  // ── Never crashes for any reasonable input ───────────────

  it("never returns null for desktop", () => {
    const decision = runPageDecisionFast(makeCtx(), makeDevice());
    expect(decision).not.toBeNull();
    expect(decision.hero.content).not.toBeNull();
  });

  it("never returns null for mobile", () => {
    const decision = runPageDecisionFast(makeCtx(), makeMobile());
    expect(decision).not.toBeNull();
    expect(decision.hero.content).not.toBeNull();
  });

  it("handles all time-of-day values", () => {
    for (const tod of ["morning", "working", "evening"] as const) {
      const decision = runPageDecisionFast(makeCtx({ timeOfDay: tod }), makeDevice());
      expect(decision.hero.content).toBeDefined();
    }
  });

  it("handles returning + weekend + social + mobile", () => {
    const decision = runPageDecisionFast(
      makeCtx({
        isReturning: true,
        isWeekend: true,
        timeOfDay: "evening",
        acquisition: {
          utm_source: null, utm_medium: null, utm_campaign: null,
          referrer: "tiktok.com", referrer_group: "social", medium: "social",
        },
      }),
      makeMobile()
    );
    expect(decision.hero.content).toBeDefined();
    expect(decision.sections.section_ids.length).toBeGreaterThan(0);
  });
});
