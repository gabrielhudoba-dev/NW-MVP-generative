import type { UserStateVector, SlotScore } from "../hero/types";
import type { DeviceContext } from "../analytics/device";

/**
 * Rules / guardrails applied after scoring.
 *
 * Can reject or downrank options that don't make sense
 * for the current user state or device context.
 */
export function applyRules(
  scores: {
    headline_scores: SlotScore[];
    description_scores: SlotScore[];
    cta_scores: SlotScore[];
    proof_scores: SlotScore[];
  },
  state: UserStateVector,
  device: DeviceContext
): {
  headline_scores: SlotScore[];
  description_scores: SlotScore[];
  cta_scores: SlotScore[];
  proof_scores: SlotScore[];
  rules_applied: string[];
} {
  const rules_applied: string[] = [];
  let { headline_scores, description_scores, cta_scores, proof_scores } = structuredClone(scores);

  // ── Rule 1: Mobile + low energy → avoid detailed descriptions ──
  if (device.device_type === "mobile" && state.energy_score < 0.4) {
    description_scores = description_scores.map((s) => {
      if (s.id === "d_scale_fragment" || s.id === "d_structure_clarity") {
        return { ...s, score: s.score * 0.5, reason: s.reason + " [downranked: mobile+low_energy]" };
      }
      return s;
    });
    rules_applied.push("mobile_low_energy_short_desc");
  }

  // ── Rule 2: Very low trust → avoid urgent CTA pressure ──
  if (state.trust_score < 0.25) {
    cta_scores = cta_scores.map((s) => {
      if (s.id === "cta_book_now") {
        return { ...s, score: s.score * 0.3, reason: s.reason + " [downranked: low_trust]" };
      }
      return s;
    });
    rules_applied.push("low_trust_no_urgent_cta");
  }

  // ── Rule 3: Not returning → never use "skip intro" description ──
  if (state.familiarity_score < 0.3) {
    description_scores = description_scores.filter((s) => s.id !== "d_skip_intro");
    if (scores.description_scores.some((s) => s.id === "d_skip_intro")) {
      rules_applied.push("not_returning_no_skip_intro");
    }
  }

  // ── Rule 4: Low energy → avoid provocative headlines ──
  if (state.energy_score < 0.35) {
    headline_scores = headline_scores.map((s) => {
      if (s.id === "h_problem_decisions" || s.id === "h_action_expensive") {
        return { ...s, score: s.score * 0.6, reason: s.reason + " [downranked: low_energy]" };
      }
      return s;
    });
    rules_applied.push("low_energy_calm_headline");
  }

  // ── Rule 5: Mobile → prefer no proof or short proof ──
  if (device.device_type === "mobile") {
    proof_scores = proof_scores.map((s) => {
      if (s.id === "proof_none") {
        return { ...s, score: Math.max(s.score, 0.7) };
      }
      return s;
    });
    rules_applied.push("mobile_prefer_no_proof");
  }

  // ── Rule 6: High intent + high trust → boost direct CTAs ──
  if (state.intent_score >= 0.6 && state.trust_score >= 0.5) {
    cta_scores = cta_scores.map((s) => {
      if (s.id === "cta_book_now" || s.id === "cta_book_15" || s.id === "cta_book_your") {
        return { ...s, score: Math.min(1, s.score * 1.2) };
      }
      return s;
    });
    rules_applied.push("high_intent_trust_direct_cta");
  }

  return { headline_scores, description_scores, cta_scores, proof_scores, rules_applied };
}
