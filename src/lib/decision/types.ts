/**
 * Decision system types.
 *
 * The new engine produces a flat PageDecision with all slot selections,
 * state vector, and decision metadata.
 */

import type { UserStateVector } from "../state/state-types";
import type { HeroContent } from "../content/content-types";
import type { SectionId } from "../content/content-types";

// ─── Scoring ────────────────────────────────────────────────

export interface SlotScore {
  id: string;
  score: number;
  reason: string;
}

export type Slot = "hero" | "description" | "proof" | "cta" | "section_sequence";

// ─── Page Decision ──────────────────────────────────────────

export type DecisionMode = "exploit" | "explore" | "preset";

export interface PageDecision {
  // Resolved content
  content: HeroContent;

  // Selected variant IDs per slot
  hero_variant: string;
  description_variant: string;
  proof_variant: string;
  cta_variant: string;
  section_sequence_id: string;

  // Resolved section list
  sections: SectionId[];

  // State & metadata
  state: UserStateVector;
  state_key: string;
  decision_mode: DecisionMode;
  epsilon_value: number;
  snapshot_id: string;
  timestamp: number;

  // Debug
  scores: Partial<Record<Slot, SlotScore[]>>;
  constraints_applied: string[];
}

// ─── Legacy compat aliases (used by DebugPanel / analytics until updated) ─────

/** @deprecated use PageDecision.state */
export type HeroDecision = PageDecision;
/** @deprecated use PageDecision.sections */
export type SectionSequenceDecision = { section_ids: SectionId[] };

export interface ScoringResult {
  scores: Record<string, SlotScore[]>;
  model: string;
  scoring_version: string;
  latency_ms: number;
}
