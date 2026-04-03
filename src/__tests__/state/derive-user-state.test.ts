import { describe, it, expect } from "vitest";
import { deriveUserState } from "@/lib/state/derive-user-state";
import { makeCtx, makeDevice, makeMobile } from "../helpers";

describe("deriveUserState", () => {
  // ── Baseline (new, direct, desktop, working hours) ───────

  it("returns baseline scores for neutral context", () => {
    const state = deriveUserState(makeCtx(), makeDevice());
    // direct: +0.2 trust, +0.2 familiarity, +0.1 intent
    // working: +0.15 energy, +0.1 attention, +0.05 decision_speed
    // desktop: +0.05 energy, +0.1 attention
    expect(state.intent_score).toBeCloseTo(0.4, 2);       // 0.3 + 0.1
    expect(state.trust_score).toBeCloseTo(0.5, 2);        // 0.3 + 0.2
    expect(state.energy_score).toBeCloseTo(0.7, 2);       // 0.5 + 0.15 + 0.05
    expect(state.decision_speed_score).toBeCloseTo(0.45, 2); // 0.4 + 0.05
    expect(state.attention_score).toBeCloseTo(0.7, 2);    // 0.5 + 0.1 + 0.1
    expect(state.familiarity_score).toBeCloseTo(0.2, 2);  // 0.0 + 0.2
  });

  // ── Returning visitor ────────────────────────────────────

  it("boosts familiarity, trust, intent for returning visitor", () => {
    const state = deriveUserState(
      makeCtx({ isReturning: true }),
      makeDevice()
    );
    // returning: +0.5 fam, +0.15 trust, +0.15 intent, +0.1 dec_speed
    // + direct: +0.2 trust, +0.2 fam, +0.1 intent
    expect(state.familiarity_score).toBeCloseTo(0.7, 2);     // 0.0 + 0.5 + 0.2
    expect(state.trust_score).toBeCloseTo(0.65, 2);          // 0.3 + 0.15 + 0.2
    expect(state.intent_score).toBeCloseTo(0.55, 2);         // 0.3 + 0.15 + 0.1
    expect(state.decision_speed_score).toBeCloseTo(0.55, 2); // 0.4 + 0.1 + 0.05
  });

  // ── Acquisition: search ──────────────────────────────────

  it("boosts intent, energy, attention for search referrer", () => {
    const state = deriveUserState(
      makeCtx({
        acquisition: {
          utm_source: null, utm_medium: null, utm_campaign: null,
          referrer: "google.com", referrer_group: "search", medium: "organic",
        },
      }),
      makeDevice()
    );
    // search: +0.15 intent, +0.1 energy, +0.1 attention
    // working: +0.15 energy, +0.1 attention, +0.05 decision_speed
    // desktop: +0.05 energy, +0.1 attention
    expect(state.intent_score).toBeCloseTo(0.45, 2);
    expect(state.energy_score).toBeCloseTo(0.8, 2);
    expect(state.attention_score).toBeCloseTo(0.8, 2);
    expect(state.familiarity_score).toBeCloseTo(0.0, 2);
  });

  // ── Acquisition: social ──────────────────────────────────

  it("penalizes trust and attention for social referrer", () => {
    const state = deriveUserState(
      makeCtx({
        acquisition: {
          utm_source: null, utm_medium: null, utm_campaign: null,
          referrer: "instagram.com", referrer_group: "social", medium: "social",
        },
      }),
      makeDevice()
    );
    // social: -0.05 trust, -0.1 attention
    expect(state.trust_score).toBeCloseTo(0.25, 2);
    expect(state.attention_score).toBeCloseTo(0.6, 2); // 0.5 - 0.1 + 0.1(working) + 0.1(desktop)
  });

  // ── UTM: linkedin ────────────────────────────────────────

  it("gives trust bonus for linkedin utm_source", () => {
    const base = deriveUserState(makeCtx(), makeDevice());
    const linked = deriveUserState(
      makeCtx({
        acquisition: {
          utm_source: "linkedin", utm_medium: null, utm_campaign: null,
          referrer: null, referrer_group: "direct", medium: "direct",
        },
      }),
      makeDevice()
    );
    expect(linked.trust_score).toBeCloseTo(base.trust_score + 0.05, 2);
  });

  // ── UTM: cpc ─────────────────────────────────────────────

  it("boosts intent and decision_speed for CPC medium", () => {
    const state = deriveUserState(
      makeCtx({
        acquisition: {
          utm_source: "google", utm_medium: "cpc", utm_campaign: "brand",
          referrer: "google.com", referrer_group: "search", medium: "cpc",
        },
      }),
      makeDevice()
    );
    // search: +0.15 intent; cpc: +0.15 intent → total = 0.3 + 0.3 = 0.6
    expect(state.intent_score).toBeCloseTo(0.6, 2);
    // cpc: +0.1 decision_speed + working: +0.05 → 0.4 + 0.15 = 0.55
    expect(state.decision_speed_score).toBeCloseTo(0.55, 2);
  });

  // ── Time of day: morning ─────────────────────────────────

  it("gives small energy/attention boost for morning", () => {
    const state = deriveUserState(
      makeCtx({ timeOfDay: "morning" }),
      makeDevice()
    );
    // morning: +0.1 energy, +0.05 attention (no decision_speed)
    expect(state.energy_score).toBeCloseTo(0.65, 2);    // 0.5 + 0.1 + 0.05(desktop)
    expect(state.attention_score).toBeCloseTo(0.65, 2);  // 0.5 + 0.05 + 0.1(desktop)
  });

  // ── Time of day: evening ─────────────────────────────────

  it("penalizes energy, attention, decision_speed for evening", () => {
    const state = deriveUserState(
      makeCtx({ timeOfDay: "evening" }),
      makeDevice()
    );
    // evening: -0.15 energy, -0.1 attention, -0.1 decision_speed
    // + direct: +0.2 trust, +0.2 fam, +0.1 intent
    // + desktop: +0.05 energy, +0.1 attention
    expect(state.energy_score).toBeCloseTo(0.4, 2);       // 0.5 - 0.15 + 0.05(desktop)
    expect(state.attention_score).toBeCloseTo(0.5, 2);    // 0.5 - 0.1 + 0.1(desktop) = 0.5
    expect(state.decision_speed_score).toBeCloseTo(0.3, 2); // 0.4 - 0.1
  });

  // ── Weekend ──────────────────────────────────────────────

  it("reduces energy, decision_speed, attention on weekend", () => {
    const state = deriveUserState(
      makeCtx({ isWeekend: true }),
      makeDevice()
    );
    // weekend: -0.1 energy, -0.1 decision_speed, -0.05 attention
    // + direct + working + desktop
    expect(state.energy_score).toBeCloseTo(0.6, 2);           // 0.7 baseline - 0.1
    expect(state.decision_speed_score).toBeCloseTo(0.35, 2);  // 0.45 baseline - 0.1
    expect(state.attention_score).toBeCloseTo(0.65, 2);       // 0.7 baseline - 0.05
  });

  // ── Device: mobile ───────────────────────────────────────

  it("reduces energy/attention but boosts decision_speed for mobile", () => {
    const state = deriveUserState(makeCtx(), makeMobile());
    // mobile: -0.1 energy, -0.1 attention, +0.05 decision_speed
    // (no desktop bonus)
    // direct + working
    expect(state.energy_score).toBeCloseTo(0.55, 2);          // 0.5 + 0.15 - 0.1
    expect(state.attention_score).toBeCloseTo(0.5, 2);        // 0.5 + 0.1 - 0.1
    expect(state.decision_speed_score).toBeCloseTo(0.5, 2);   // 0.4 + 0.05 + 0.05
  });

  // ── Clamping ─────────────────────────────────────────────

  it("clamps all scores between 0 and 1", () => {
    // Stack everything negative: social + evening + weekend + mobile
    const state = deriveUserState(
      makeCtx({
        timeOfDay: "evening",
        isWeekend: true,
        acquisition: {
          utm_source: null, utm_medium: null, utm_campaign: null,
          referrer: "tiktok.com", referrer_group: "social", medium: "social",
        },
      }),
      makeMobile()
    );
    for (const [, val] of Object.entries(state)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("clamps all scores with maximum positive signals", () => {
    const state = deriveUserState(
      makeCtx({
        isReturning: true,
        acquisition: {
          utm_source: "linkedin", utm_medium: "cpc", utm_campaign: "brand",
          referrer: "google.com", referrer_group: "search", medium: "cpc",
        },
      }),
      makeDevice()
    );
    for (const [, val] of Object.entries(state)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  // ── Precision ────────────────────────────────────────────

  it("returns scores rounded to 2 decimal places", () => {
    const state = deriveUserState(makeCtx(), makeDevice());
    for (const [, val] of Object.entries(state)) {
      const rounded = Math.round(val * 100) / 100;
      expect(val).toBe(rounded);
    }
  });
});
