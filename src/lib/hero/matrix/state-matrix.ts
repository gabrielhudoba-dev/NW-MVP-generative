import type { MatrixEntry } from "../types";

/**
 * State matrix — maps user state keys to allowed content options per slot.
 *
 * State keys are derived from the user state vector buckets:
 *   {intent}_{trust}_{energy}
 *
 * Each entry defines ALLOWED options. The AI scorer picks the best
 * combination from within these allowed options.
 */
export const STATE_MATRIX: MatrixEntry[] = [
  // ── Exploring, Low Trust, High Energy ──
  {
    state_key: "exploring_lowtrust_highenergy",
    allowed_headlines: ["h_problem_clarity", "h_problem_decisions", "h_action_expensive"],
    allowed_descriptions: ["d_scale_fragment", "d_cost_compounds", "d_precision_not_guess"],
    allowed_ctas: ["cta_book_call", "cta_worth_conversation", "cta_lets_talk"],
    allowed_proofs: ["proof_teams_at_scale", "proof_no_pitch"],
  },
  // ── Exploring, Low Trust, Low Energy ──
  {
    state_key: "exploring_lowtrust_lowenergy",
    allowed_headlines: ["h_problem_clarity", "h_authority_complex"],
    allowed_descriptions: ["d_one_conversation", "d_clear_thinking", "d_precision_not_guess"],
    allowed_ctas: ["cta_lets_talk", "cta_worth_conversation"],
    allowed_proofs: ["proof_no_pitch", "proof_none"],
  },
  // ── Exploring, High Trust, High Energy ──
  {
    state_key: "exploring_hightrust_highenergy",
    allowed_headlines: ["h_authority_complex", "h_authority_define", "h_outcome_precision"],
    allowed_descriptions: ["d_structure_clarity", "d_scale_fragment", "d_precision_not_guess"],
    allowed_ctas: ["cta_book_call", "cta_book_15", "cta_lets_talk"],
    allowed_proofs: ["proof_teams_at_scale", "proof_precision"],
  },
  // ── Exploring, High Trust, Low Energy ──
  {
    state_key: "exploring_hightrust_lowenergy",
    allowed_headlines: ["h_authority_complex", "h_outcome_precision"],
    allowed_descriptions: ["d_clear_thinking", "d_one_conversation", "d_structure_clarity"],
    allowed_ctas: ["cta_lets_talk", "cta_book_call"],
    allowed_proofs: ["proof_no_pitch", "proof_none"],
  },
  // ── Evaluating, Low Trust, High Energy ──
  {
    state_key: "evaluating_lowtrust_highenergy",
    allowed_headlines: ["h_action_expensive", "h_problem_clarity", "h_problem_decisions"],
    allowed_descriptions: ["d_cost_compounds", "d_scale_fragment", "d_precision_not_guess"],
    allowed_ctas: ["cta_book_call", "cta_book_15"],
    allowed_proofs: ["proof_teams_at_scale", "proof_precision", "proof_no_pitch"],
  },
  // ── Evaluating, Low Trust, Low Energy ──
  {
    state_key: "evaluating_lowtrust_lowenergy",
    allowed_headlines: ["h_problem_clarity", "h_authority_complex"],
    allowed_descriptions: ["d_precision_not_guess", "d_one_conversation"],
    allowed_ctas: ["cta_book_call", "cta_lets_talk"],
    allowed_proofs: ["proof_no_pitch", "proof_teams_at_scale"],
  },
  // ── Evaluating, High Trust, High Energy ──
  {
    state_key: "evaluating_hightrust_highenergy",
    allowed_headlines: ["h_authority_define", "h_outcome_precision", "h_action_expensive"],
    allowed_descriptions: ["d_structure_clarity", "d_precision_not_guess", "d_cost_compounds"],
    allowed_ctas: ["cta_book_15", "cta_book_call", "cta_book_your"],
    allowed_proofs: ["proof_precision", "proof_teams_at_scale"],
  },
  // ── Evaluating, High Trust, Low Energy ──
  {
    state_key: "evaluating_hightrust_lowenergy",
    allowed_headlines: ["h_authority_define", "h_outcome_precision"],
    allowed_descriptions: ["d_clear_thinking", "d_precision_not_guess"],
    allowed_ctas: ["cta_book_call", "cta_lets_talk"],
    allowed_proofs: ["proof_no_pitch", "proof_precision"],
  },
  // ── Ready, Low Trust, Any Energy ──
  {
    state_key: "ready_lowtrust_highenergy",
    allowed_headlines: ["h_action_expensive", "h_problem_decisions"],
    allowed_descriptions: ["d_cost_compounds", "d_precision_not_guess"],
    allowed_ctas: ["cta_book_15", "cta_book_call"],
    allowed_proofs: ["proof_teams_at_scale", "proof_no_pitch"],
  },
  {
    state_key: "ready_lowtrust_lowenergy",
    allowed_headlines: ["h_action_expensive", "h_problem_clarity"],
    allowed_descriptions: ["d_one_conversation", "d_precision_not_guess"],
    allowed_ctas: ["cta_book_15", "cta_book_now"],
    allowed_proofs: ["proof_no_pitch"],
  },
  // ── Ready, High Trust, High Energy ──
  {
    state_key: "ready_hightrust_highenergy",
    allowed_headlines: ["h_authority_define", "h_outcome_precision", "h_action_expensive"],
    allowed_descriptions: ["d_skip_intro", "d_precision_not_guess", "d_structure_clarity"],
    allowed_ctas: ["cta_book_now", "cta_book_15", "cta_book_your"],
    allowed_proofs: ["proof_precision", "proof_none"],
  },
  // ── Ready, High Trust, Low Energy ──
  {
    state_key: "ready_hightrust_lowenergy",
    allowed_headlines: ["h_outcome_precision", "h_authority_define"],
    allowed_descriptions: ["d_skip_intro", "d_one_conversation", "d_clear_thinking"],
    allowed_ctas: ["cta_book_now", "cta_book_your", "cta_lets_talk"],
    allowed_proofs: ["proof_none", "proof_no_pitch"],
  },
];

const MATRIX_MAP = new Map(STATE_MATRIX.map((e) => [e.state_key, e]));

/**
 * Look up the matrix entry for a state key.
 * Falls back to a safe default if no exact match.
 */
export function lookupMatrix(stateKey: string): MatrixEntry {
  const exact = MATRIX_MAP.get(stateKey);
  if (exact) return exact;

  // Fallback: exploring_lowtrust_highenergy is the safest general-purpose entry
  return MATRIX_MAP.get("exploring_lowtrust_highenergy")!;
}
