/**
 * Persona presets — hardcoded visitor contexts for design preview.
 *
 * Each persona simulates a specific visitor profile:
 * context signals + device. Used by ?persona=A switcher.
 */

import type { VisitorContext } from "@/lib/context/collect-context";
import type { DeviceContext } from "@/lib/analytics/device";

export interface PersonaPreset {
  id: string;
  label: string;
  description: string;
  /** Expected state key after derivation */
  expectedStateKey: string;
  ctx: VisitorContext;
  device: DeviceContext;
}

const weather = { temp: null, condition: null, city: null };

export const PERSONAS: PersonaPreset[] = [
  {
    id: "A",
    label: "New Direct Desktop",
    description: "New visitor, desktop, working hours, direct traffic",
    expectedStateKey: "evaluating_high_high",
    ctx: {
      timeOfDay: "working",
      isWeekend: false,
      isReturning: false,
      locale: "en-US",
      language: "en",
      country: null,
      weather,
      acquisition: {
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: null,
        referrer_group: "direct",
        medium: "direct",
      },
    },
    device: {
      device_type: "desktop",
      viewport_w: 1440,
      viewport_h: 900,
      breakpoint_bucket: "wide",
    },
  },
  {
    id: "B",
    label: "Returning Search",
    description: "Returning, desktop, search, working hours",
    expectedStateKey: "ready_medium_high",
    ctx: {
      timeOfDay: "working",
      isWeekend: false,
      isReturning: true,
      locale: "en-US",
      language: "en",
      country: null,
      weather,
      acquisition: {
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: "google.com",
        referrer_group: "search",
        medium: "organic",
      },
    },
    device: {
      device_type: "desktop",
      viewport_w: 1440,
      viewport_h: 900,
      breakpoint_bucket: "wide",
    },
  },
  {
    id: "C",
    label: "Mobile Evening Social",
    description: "Mobile, evening, social, first visit",
    expectedStateKey: "exploring_low_low",
    ctx: {
      timeOfDay: "evening",
      isWeekend: false,
      isReturning: false,
      locale: "en-US",
      language: "en",
      country: null,
      weather,
      acquisition: {
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: "instagram.com",
        referrer_group: "social",
        medium: "social",
      },
    },
    device: {
      device_type: "mobile",
      viewport_w: 390,
      viewport_h: 844,
      breakpoint_bucket: "mobile",
    },
  },
  {
    id: "D",
    label: "CPC Returning",
    description: "Desktop, CPC, returning, search",
    expectedStateKey: "ready_high_high",
    ctx: {
      timeOfDay: "working",
      isWeekend: false,
      isReturning: true,
      locale: "en-US",
      language: "en",
      country: null,
      weather,
      acquisition: {
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "brand",
        referrer: "google.com",
        referrer_group: "search",
        medium: "cpc",
      },
    },
    device: {
      device_type: "desktop",
      viewport_w: 1440,
      viewport_h: 900,
      breakpoint_bucket: "wide",
    },
  },
  {
    id: "E",
    label: "Mobile Weekend Referral",
    description: "Mobile, weekend, referral, working hours",
    expectedStateKey: "exploring_medium_high",
    ctx: {
      timeOfDay: "working",
      isWeekend: true,
      isReturning: false,
      locale: "en-US",
      language: "en",
      country: null,
      weather,
      acquisition: {
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: "clutch.co",
        referrer_group: "referral",
        medium: "referral",
      },
    },
    device: {
      device_type: "mobile",
      viewport_w: 390,
      viewport_h: 844,
      breakpoint_bucket: "mobile",
    },
  },
  {
    id: "F",
    label: "Email Returning Evening",
    description: "Desktop, email, returning, evening",
    expectedStateKey: "evaluating_high_low",
    ctx: {
      timeOfDay: "evening",
      isWeekend: false,
      isReturning: true,
      locale: "en-US",
      language: "en",
      country: null,
      weather,
      acquisition: {
        utm_source: "mailchimp",
        utm_medium: "email",
        utm_campaign: "newsletter",
        referrer: null,
        referrer_group: "email",
        medium: "email",
      },
    },
    device: {
      device_type: "desktop",
      viewport_w: 1440,
      viewport_h: 900,
      breakpoint_bucket: "wide",
    },
  },
];

export const PERSONAS_MAP: Record<string, PersonaPreset> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p])
);
