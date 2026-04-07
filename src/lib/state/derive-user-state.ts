/**
 * Deterministic user state derivation.
 *
 * Transforms raw context signals into a continuous 0–1 state vector.
 * No AI — pure additive math from visitor signals.
 */

import type { UserStateVector } from "./state-types";
import type { VisitorContext } from "../context/collect-context";
import type { DeviceContext } from "../analytics/device";

export function deriveUserState(
  ctx: VisitorContext,
  device: DeviceContext
): UserStateVector {
  let intent = 0.30;
  let trust = 0.30;
  let energy = 0.50;
  let attention = 0.50;
  let familiarity = 0.00;

  // ── Returning visitor ──
  if (ctx.isReturning) {
    intent += 0.12;
    trust += 0.12;
    familiarity += 0.45;
  }

  // ── Referrer source ──
  const ref = ctx.acquisition.referrer_group;
  if (ref === "direct") {
    intent += 0.08;
    trust += 0.16;
    familiarity += 0.18;
  } else if (ref === "referral") {
    trust += 0.14;
  } else if (ref === "social") {
    trust -= 0.04;
    attention -= 0.06;
  } else if (ref === "search") {
    intent += 0.14;
    energy += 0.08;
    attention += 0.08;
  } else if (ref === "email") {
    intent += 0.10;
    trust += 0.08;
    familiarity += 0.12;
  }

  // ── UTM signals ──
  if (ctx.acquisition.utm_source === "linkedin") {
    trust += 0.04;
  }
  if (ctx.acquisition.utm_medium === "cpc") {
    intent += 0.10;
    attention += 0.06;
  }

  // ── Time of day ──
  if (ctx.timeOfDay === "working") {
    energy += 0.10;
    attention += 0.08;
  } else if (ctx.timeOfDay === "evening") {
    energy -= 0.08;
    attention -= 0.04;
  } else if (ctx.timeOfDay === "late") {
    energy -= 0.15;
    attention -= 0.10;
  }

  // ── Weekend ──
  if (ctx.isWeekend) {
    intent -= 0.05;
    energy -= 0.04;
  }

  // ── Behavioral signals (from session) ──
  if (ctx.pages_seen_session >= 2) {
    trust += 0.08;
    familiarity += 0.10;
  }
  if (ctx.case_study_views_session >= 1) {
    intent += 0.12;
    trust += 0.10;
  }
  if (ctx.booking_page_views_session >= 1) {
    intent += 0.18;
    trust += 0.05;
  }
  if (ctx.scroll_depth >= 0.50) {
    attention += 0.10;
    intent += 0.06;
  }
  if (ctx.time_on_page_sec >= 45) {
    attention += 0.10;
    trust += 0.08;
  }

  // ── Device ──
  if (device.device_type === "mobile") {
    energy -= 0.10;
    attention -= 0.10;
  } else if (device.device_type === "desktop") {
    energy += 0.05;
    attention += 0.10;
  }

  return {
    intent_score: clamp(intent),
    trust_score: clamp(trust),
    energy_score: clamp(energy),
    attention_score: clamp(attention),
    familiarity_score: clamp(familiarity),
  };
}

function clamp(v: number): number {
  return Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
}
