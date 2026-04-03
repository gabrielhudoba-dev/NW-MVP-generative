/**
 * Shared test helpers — factory functions for context + device mocks.
 */

import type { VisitorContext } from "@/lib/context/collect-context";
import type { DeviceContext } from "@/lib/analytics/device";
import type { UserStateVector } from "@/lib/state/state-types";

// ─── Default Contexts ──────────────────────────────────────

export function makeCtx(overrides: Partial<VisitorContext> = {}): VisitorContext {
  return {
    timeOfDay: "working",
    isWeekend: false,
    isReturning: false,
    locale: "en-US",
    language: "en",
    country: null,
    weather: { temp: null, condition: null, city: null },
    acquisition: {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referrer: null,
      referrer_group: "direct",
      medium: "direct",
    },
    ...overrides,
  };
}

export function makeDevice(overrides: Partial<DeviceContext> = {}): DeviceContext {
  return {
    device_type: "desktop",
    viewport_w: 1440,
    viewport_h: 900,
    breakpoint_bucket: "wide",
    ...overrides,
  };
}

export function makeMobile(): DeviceContext {
  return makeDevice({
    device_type: "mobile",
    viewport_w: 390,
    viewport_h: 844,
    breakpoint_bucket: "mobile",
  });
}

export function makeState(overrides: Partial<UserStateVector> = {}): UserStateVector {
  return {
    intent_score: 0.3,
    trust_score: 0.3,
    energy_score: 0.5,
    decision_speed_score: 0.4,
    attention_score: 0.5,
    familiarity_score: 0.0,
    ...overrides,
  };
}

// ─── Persona Presets ───────────────────────────────────────

/** New visitor, desktop, working hours, direct traffic */
export const PERSONA_NEW_DIRECT_DESKTOP = {
  ctx: makeCtx(),
  device: makeDevice(),
};

/** Returning visitor, desktop, search, working hours */
export const PERSONA_RETURNING_SEARCH = {
  ctx: makeCtx({
    isReturning: true,
    acquisition: {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referrer: "google.com",
      referrer_group: "search",
      medium: "organic",
    },
  }),
  device: makeDevice(),
};

/** Mobile, evening, social, first visit */
export const PERSONA_MOBILE_EVENING_SOCIAL = {
  ctx: makeCtx({
    timeOfDay: "evening",
    acquisition: {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referrer: "instagram.com",
      referrer_group: "social",
      medium: "social",
    },
  }),
  device: makeMobile(),
};

/** Desktop, CPC, returning */
export const PERSONA_CPC_RETURNING = {
  ctx: makeCtx({
    isReturning: true,
    acquisition: {
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "brand",
      referrer: "google.com",
      referrer_group: "search",
      medium: "cpc",
    },
  }),
  device: makeDevice(),
};

/** Mobile, weekend, referral */
export const PERSONA_MOBILE_WEEKEND_REFERRAL = {
  ctx: makeCtx({
    isWeekend: true,
    acquisition: {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referrer: "clutch.co",
      referrer_group: "referral",
      medium: "referral",
    },
  }),
  device: makeMobile(),
};

/** Desktop, email, returning, evening */
export const PERSONA_EMAIL_RETURNING_EVENING = {
  ctx: makeCtx({
    isReturning: true,
    timeOfDay: "evening",
    acquisition: {
      utm_source: "mailchimp",
      utm_medium: "email",
      utm_campaign: "newsletter",
      referrer: null,
      referrer_group: "email",
      medium: "email",
    },
  }),
  device: makeDevice(),
};
