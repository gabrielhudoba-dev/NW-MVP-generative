/**
 * Predefined section sequences.
 *
 * Each sequence maps to an ordered list of section IDs.
 * The engine selects a sequence via scoring + epsilon-greedy,
 * then resolves the actual sections from SECTIONS_MAP.
 */

import type { SectionId } from "./content-types";

export const SECTION_SEQUENCES: Record<string, SectionId[]> = {
  shift_consequence_position_cta: [
    "shift", "consequence", "position", "cta_soft",
  ],
  position_model_logic_cta: [
    "position", "working_model", "intervention_logic", "cta_direct",
  ],
  position_proof_cta: [
    "position", "proof_argument", "cta_direct",
  ],
  position_case_cta: [
    "position", "business_model", "cta_direct",
  ],
  position_logic_proof_cta: [
    "position", "intervention_logic", "proof_kpi", "cta_direct",
  ],
};
