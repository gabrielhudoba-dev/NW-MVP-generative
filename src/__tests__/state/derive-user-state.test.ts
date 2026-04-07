import { describe, it, expect } from "vitest";
import { deriveUserState } from "@/lib/state/derive-user-state";
import { makeCtx, makeDevice, makeMobile } from "../helpers";

describe("deriveUserState", () => {
  // ── Baseline (new, direct, desktop, working hours) ───────

  it("returns expected scores for neutral context", () => {
    const state = deriveUserState(makeCtx(), makeDevice());
    // direct: +0.08 intent, +0.16 trust, +0.18 familiarity
    // working: +0.10 energy, +0.08 attention
    // desktop: +0.05 energy, +0.10 attention
    expect(state.intent_score).toBeCloseTo(0.38, 2);       // 0.30 + 0.08
    expect(state.trust_score).toBeCloseTo(0.46, 2);        // 0.30 + 0.16
    expect(state.energy_score).toBeCloseTo(0.65, 2);       // 0.50 + 0.10 + 0.05
    expect(state.attention_score).toBeCloseTo(0.68, 2);    // 0.50 + 0.08 + 0.10
    expect(state.familiarity_score).toBeCloseTo(0.18, 2);  // 0.00 + 0.18
  });

  it("does not include decision_speed_score", () => {
    const state = deriveUserState(makeCtx(), makeDevice());
    expect(Object.keys(state)).not.toContain("decision_speed_score");
  });

  // ── Returning visitor ────────────────────────────────────

  it("boosts familiarity, trust, intent for returning visitor", () => {
    const state = deriveUserState(
      makeCtx({ isReturning: true }),
      makeDevice()
    );
    // returning: +0.12 intent, +0.12 trust, +0.45 familiarity
    // + direct + working + desktop
    expect(state.familiarity_score).toBeCloseTo(0.63, 2);  // 0.00 + 0.45 + 0.18
    expect(state.trust_score).toBeCloseTo(0.58, 2);        // 0.30 + 0.12 + 0.16
    expect(state.intent_score).toBeCloseTo(0.50, 2);       // 0.30 + 0.12 + 0.08
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
    // search: +0.14 intent, +0.08 energy, +0.08 attention
    // working: +0.10 energy, +0.08 attention
    // desktop: +0.05 energy, +0.10 attention
    expect(state.intent_score).toBeCloseTo(0.44, 2);
    expect(state.energy_score).toBeCloseTo(0.73, 2);
    expect(state.attention_score).toBeCloseTo(0.76, 2);
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
    // social: -0.04 trust, -0.06 attention
    expect(state.trust_score).toBeCloseTo(0.26, 2);
    expect(state.attention_score).toBeCloseTo(0.62, 2); // 0.50 - 0.06 + 0.08 + 0.10
  });

  // ── Acquisition: referral ────────────────────────────────

  it("boosts trust for referral channel", () => {
    const state = deriveUserState(
      makeCtx({
        acquisition: {
          utm_source: null, utm_medium: null, utm_campaign: null,
          referrer: "clutch.co", referrer_group: "referral", medium: "referral",
        },
      }),
      makeDevice()
    );
    // referral: +0.14 trust
    expect(state.trust_score).toBeCloseTo(0.44, 2); // 0.30 + 0.14
  });

  // ── Acquisition: email ───────────────────────────────────

  it("boosts intent, trust, familiarity for email channel", () => {
    const state = deriveUserState(
      makeCtx({
        acquisition: {
          utm_source: "mailchimp", utm_medium: "email", utm_campaign: "newsletter",
          referrer: null, referrer_group: "email", medium: "email",
        },
      }),
      makeDevice()
    );
    // email: +0.10 intent, +0.08 trust, +0.12 familiarity
    expect(state.intent_score).toBeCloseTo(0.40, 2); // 0.30 + 0.10
    expect(state.trust_score).toBeCloseTo(0.38, 2);  // 0.30 + 0.08
    expect(state.familiarity_score).toBeCloseTo(0.12, 2);
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
    expect(linked.trust_score).toBeCloseTo(base.trust_score + 0.04, 2);
  });

  // ── UTM: cpc ─────────────────────────────────────────────

  it("boosts intent and attention for CPC medium", () => {
    const state = deriveUserState(
      makeCtx({
        acquisition: {
          utm_source: "google", utm_medium: "cpc", utm_campaign: "brand",
          referrer: "google.com", referrer_group: "search", medium: "cpc",
        },
      }),
      makeDevice()
    );
    // search: +0.14 intent; cpc: +0.10 intent → total = 0.30 + 0.24 = 0.54
    expect(state.intent_score).toBeCloseTo(0.54, 2);
  });

  // ── Time of day: morning ─────────────────────────────────

  it("gives no time-of-day boost for morning (neutral baseline)", () => {
    const state = deriveUserState(
      makeCtx({ timeOfDay: "morning" }),
      makeDevice()
    );
    // morning: no time-of-day adjustment (only direct + desktop)
    expect(state.energy_score).toBeCloseTo(0.55, 2);   // 0.50 + 0.05 (desktop only)
    expect(state.attention_score).toBeCloseTo(0.60, 2); // 0.50 + 0.10 (desktop only)
  });

  // ── Time of day: working ─────────────────────────────────

  it("boosts energy and attention for working hours", () => {
    const working = deriveUserState(makeCtx({ timeOfDay: "working" }), makeDevice());
    const morning = deriveUserState(makeCtx({ timeOfDay: "morning" }), makeDevice());
    expect(working.energy_score).toBeCloseTo(morning.energy_score + 0.10, 2);
    expect(working.attention_score).toBeCloseTo(morning.attention_score + 0.08, 2);
  });

  // ── Time of day: evening ─────────────────────────────────

  it("penalizes energy and attention for evening", () => {
    const state = deriveUserState(
      makeCtx({ timeOfDay: "evening" }),
      makeDevice()
    );
    // evening: -0.08 energy, -0.04 attention
    // direct: +0.08 intent, +0.16 trust; desktop: +0.05 energy, +0.10 attention
    expect(state.energy_score).toBeCloseTo(0.47, 2);    // 0.50 - 0.08 + 0.05
    expect(state.attention_score).toBeCloseTo(0.56, 2); // 0.50 - 0.04 + 0.10
  });

  // ── Time of day: late ────────────────────────────────────

  it("penalizes energy and attention for late night", () => {
    const state = deriveUserState(
      makeCtx({ timeOfDay: "late" }),
      makeDevice()
    );
    // late: -0.15 energy, -0.10 attention
    expect(state.energy_score).toBeCloseTo(0.40, 2);    // 0.50 - 0.15 + 0.05
    expect(state.attention_score).toBeCloseTo(0.50, 2); // 0.50 - 0.10 + 0.10
  });

  // ── Weekend ──────────────────────────────────────────────

  it("reduces intent and energy on weekend", () => {
    const state = deriveUserState(
      makeCtx({ isWeekend: true }),
      makeDevice()
    );
    // weekend: -0.05 intent, -0.04 energy
    expect(state.intent_score).toBeCloseTo(0.33, 2); // 0.38 baseline - 0.05
    expect(state.energy_score).toBeCloseTo(0.61, 2); // 0.65 baseline - 0.04
  });

  // ── Behavioral signals ───────────────────────────────────

  it("boosts trust and familiarity for multi-page sessions", () => {
    const state = deriveUserState(
      makeCtx({ pages_seen_session: 3 }),
      makeDevice()
    );
    // pages >= 2: +0.08 trust, +0.10 familiarity
    expect(state.trust_score).toBeCloseTo(0.54, 2);        // 0.46 + 0.08
    expect(state.familiarity_score).toBeCloseTo(0.28, 2);  // 0.18 + 0.10
  });

  it("boosts intent and trust when case study was viewed", () => {
    const state = deriveUserState(
      makeCtx({ case_study_views_session: 1 }),
      makeDevice()
    );
    // case_study >= 1: +0.12 intent, +0.10 trust
    expect(state.intent_score).toBeCloseTo(0.50, 2); // 0.38 + 0.12
    expect(state.trust_score).toBeCloseTo(0.56, 2);  // 0.46 + 0.10
  });

  it("boosts intent and trust when booking page was viewed", () => {
    const state = deriveUserState(
      makeCtx({ booking_page_views_session: 1 }),
      makeDevice()
    );
    // booking_page >= 1: +0.18 intent, +0.05 trust
    expect(state.intent_score).toBeCloseTo(0.56, 2); // 0.38 + 0.18
    expect(state.trust_score).toBeCloseTo(0.51, 2);  // 0.46 + 0.05
  });

  it("boosts attention and intent for high scroll depth", () => {
    const state = deriveUserState(
      makeCtx({ scroll_depth: 0.7 }),
      makeDevice()
    );
    // scroll >= 0.50: +0.10 attention, +0.06 intent
    expect(state.attention_score).toBeCloseTo(0.78, 2); // 0.68 + 0.10
    expect(state.intent_score).toBeCloseTo(0.44, 2);    // 0.38 + 0.06
  });

  it("boosts attention and trust for long time on page", () => {
    const state = deriveUserState(
      makeCtx({ time_on_page_sec: 60 }),
      makeDevice()
    );
    // time >= 45s: +0.10 attention, +0.08 trust
    expect(state.attention_score).toBeCloseTo(0.78, 2); // 0.68 + 0.10
    expect(state.trust_score).toBeCloseTo(0.54, 2);     // 0.46 + 0.08
  });

  // ── Device: mobile ───────────────────────────────────────

  it("reduces energy and attention for mobile", () => {
    const state = deriveUserState(makeCtx(), makeMobile());
    // mobile: -0.10 energy, -0.10 attention; no desktop bonus
    // direct + working only
    expect(state.energy_score).toBeCloseTo(0.50, 2); // 0.50 + 0.10 - 0.10
    expect(state.attention_score).toBeCloseTo(0.48, 2); // 0.50 + 0.08 - 0.10
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
    for (const val of Object.values(state)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("clamps all scores with maximum positive signals", () => {
    const state = deriveUserState(
      makeCtx({
        isReturning: true,
        pages_seen_session: 3,
        case_study_views_session: 1,
        booking_page_views_session: 1,
        scroll_depth: 0.9,
        time_on_page_sec: 120,
        acquisition: {
          utm_source: "linkedin", utm_medium: "cpc", utm_campaign: "brand",
          referrer: "google.com", referrer_group: "search", medium: "cpc",
        },
      }),
      makeDevice()
    );
    for (const val of Object.values(state)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  // ── Precision ────────────────────────────────────────────

  it("returns scores rounded to 2 decimal places", () => {
    const state = deriveUserState(makeCtx(), makeDevice());
    for (const val of Object.values(state)) {
      const rounded = Math.round(val * 100) / 100;
      expect(val).toBe(rounded);
    }
  });
});
