/**
 * Decision system types — section-agnostic.
 *
 * Shared types for hero decisions, section sequence decisions,
 * and any future decision domain.
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

export interface ScoringResult {
  scores: Record<string, SlotScore[]>;
  model: string;
  scoring_version: string;
  latency_ms: number;
}

// ─── Hero Decision ──────────────────────────────────────────

export interface HeroDecision {
  content: HeroContent;
  selected_ids: Record<string, string>;
  state_vector: UserStateVector;
  state_key: string;
  scoring: ScoringResult | null;
  selection_method: "deterministic" | "ai" | "fallback";
  rejected_ids: string[];
  rules_applied: string[];
  ai_error: string | null;
  snapshot_id: string;
  timestamp: number;
}

// ─── Section Sequence Decision ──────────────────────────────

export interface SectionSequenceDecision {
  section_ids: SectionId[];
  state_vector: UserStateVector;
  state_key: string;
  selection_method: "deterministic" | "ai" | "fallback";
  allowed_ids: SectionId[];
  ai_scores: SlotScore[] | null;
  rules_applied: string[];
  ai_error: string | null;
  snapshot_id: string;
  timestamp: number;
}

// ─── Combined Page Decision ─────────────────────────────────

export interface PageDecision {
  hero: HeroDecision;
  sections: SectionSequenceDecision;
  snapshot_id: string;
  timestamp: number;
}
