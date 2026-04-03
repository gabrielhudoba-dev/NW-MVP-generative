/**
 * Deterministic user state derivation.
 *
 * Transforms raw context signals into a continuous 0–1 state vector.
 * No AI — pure logic. This is the foundation for all downstream decisions.
 */

import type { UserStateVector } from "./state-types";
import type { VisitorContext } from "../context/collect-context";
import type { DeviceContext } from "../analytics/device";

export function deriveUserState(
  ctx: VisitorContext,
  device: DeviceContext
): UserStateVector {
  let intent = 0.3;
  let trust = 0.3;
  let energy = 0.5;
  let decision_speed = 0.4;
  let attention = 0.5;
  let familiarity = 0.0;

  // ── Returning visitor signals ──
  if (ctx.isReturning) {
    familiarity += 0.5;
    trust += 0.15;
    intent += 0.15;
    decision_speed += 0.1;
  }

  // ── Acquisition signals ──
  const ref = ctx.acquisition.referrer_group;
  if (ref === "direct") {
    trust += 0.2;
    familiarity += 0.2;
    intent += 0.1;
  } else if (ref === "referral") {
    trust += 0.15;
  } else if (ref === "social") {
    trust -= 0.05;
    attention -= 0.1;
  } else if (ref === "search") {
    intent += 0.15;
    energy += 0.1;
    attention += 0.1;
  } else if (ref === "email") {
    trust += 0.1;
    intent += 0.1;
  }

  // ── UTM signals ──
  if (ctx.acquisition.utm_source === "linkedin") {
    trust += 0.05;
  }
  if (ctx.acquisition.utm_medium === "cpc") {
    intent += 0.15;
    decision_speed += 0.1;
  }

  // ── Time of day ──
  if (ctx.timeOfDay === "working") {
    energy += 0.15;
    attention += 0.1;
    decision_speed += 0.05;
  } else if (ctx.timeOfDay === "morning") {
    energy += 0.1;
    attention += 0.05;
  } else if (ctx.timeOfDay === "evening") {
    energy -= 0.15;
    attention -= 0.1;
    decision_speed -= 0.1;
  }

  // ── Weekend ──
  if (ctx.isWeekend) {
    energy -= 0.1;
    decision_speed -= 0.1;
    attention -= 0.05;
  }

  // ── Device signals ──
  if (device.device_type === "mobile") {
    energy -= 0.1;
    attention -= 0.1;
    decision_speed += 0.05;
  } else if (device.device_type === "desktop") {
    energy += 0.05;
    attention += 0.1;
  }

  return {
    intent_score: clamp(intent),
    trust_score: clamp(trust),
    energy_score: clamp(energy),
    decision_speed_score: clamp(decision_speed),
    attention_score: clamp(attention),
    familiarity_score: clamp(familiarity),
  };
}

function clamp(v: number): number {
  return Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
}
