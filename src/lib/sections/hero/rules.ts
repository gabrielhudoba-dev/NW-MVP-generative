/**
 * Hero section guardrail rules — from Content doc.
 *
 * Applied after scoring (both deterministic and AI).
 *
 * Device overrides:
 * - mobile → force short description, avoid heavy proof
 *
 * Source overrides (encoded via state vector — direct/referral
 * visitors already get higher trust scores, so authority headlines
 * and direct CTAs are naturally preferred by scoring).
 */

import type { Rule } from "../../decision/types";

export const HERO_RULES: Rule[] = [
  // Device: mobile → force short descriptions
  {
    id: "mobile_force_short_desc",
    condition: (_state, device) => device.device_type === "mobile",
    apply: (scores) => ({
      ...scores,
      description: scores.description.map((s) =>
        s.id.startsWith("desc_medium")
          ? { ...s, score: s.score * 0.4, reason: s.reason + " [mobile→short]" }
          : { ...s, score: Math.max(s.score, 0.7) }
      ),
    }),
  },

  // Device: mobile → avoid heavy proof (prefer none or argument)
  {
    id: "mobile_avoid_heavy_proof",
    condition: (_state, device) => device.device_type === "mobile",
    apply: (scores) => ({
      ...scores,
      proof: scores.proof.map((s) => {
        if (s.id === "proof_none") return { ...s, score: Math.max(s.score, 0.7) };
        if (s.id === "proof_argument_a") return s; // argument is lightweight text
        if (s.id === "proof_showreel_a") return { ...s, score: s.score * 0.5, reason: s.reason + " [mobile→light]" };
        if (s.id === "proof_kpi_a") return { ...s, score: s.score * 0.6, reason: s.reason + " [mobile→light]" };
        return s;
      }),
    }),
  },

  // Low energy + evening → prefer none proof
  {
    id: "low_energy_evening_no_proof",
    condition: (state) => state.energy_score < 0.35,
    apply: (scores) => ({
      ...scores,
      proof: scores.proof.map((s) =>
        s.id === "proof_none"
          ? { ...s, score: Math.max(s.score, 0.85) }
          : { ...s, score: s.score * 0.5, reason: s.reason + " [low_energy→none]" }
      ),
    }),
  },
];
