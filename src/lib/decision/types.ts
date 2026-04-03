/**
 * Core types for the generic decision system.
 *
 * Section-agnostic — any section (hero, pricing, testimonials, etc.)
 * can plug into this model by providing a SectionConfig.
 */

import type { DeviceContext } from "../analytics/device";
import type { VisitorContext } from "../personalization";

// ─── State Vector ───────────────────────────────────────────

export interface UserStateVector {
  /** How ready the visitor is to take action (0 = browsing, 1 = ready to book) */
  intent_score: number;
  /** How much the visitor trusts the brand (0 = skeptical, 1 = high trust) */
  trust_score: number;
  /** Cognitive energy / willingness to read (0 = fatigued, 1 = sharp) */
  energy_score: number;
  /** How quickly the visitor wants to decide (0 = slow/thoughtful, 1 = fast) */
  decision_speed_score: number;
  /** How engaged / focused the visitor is (0 = distracted, 1 = locked in) */
  attention_score: number;
  /** How familiar the visitor is with NW (0 = first touch, 1 = returning regular) */
  familiarity_score: number;
}

// ─── Scoring ────────────────────────────────────────────────

export interface SlotScore {
  id: string;
  score: number;
  reason: string;
}

export interface ScoringResult {
  /** Scores keyed by slot name (e.g. "headline", "cta") */
  scores: Record<string, SlotScore[]>;
  model: string;
  scoring_version: string;
  latency_ms: number;
}

// ─── Matrix ─────────────────────────────────────────────────

export interface MatrixEntry {
  state_key: string;
  /** Allowed content IDs keyed by slot name */
  allowed: Record<string, string[]>;
}

// ─── Rules ──────────────────────────────────────────────────

export interface Rule {
  id: string;
  /** Return true if this rule should fire */
  condition: (state: UserStateVector, device: DeviceContext) => boolean;
  /** Modify scores in place — return the updated scores map */
  apply: (scores: Record<string, SlotScore[]>) => Record<string, SlotScore[]>;
}

// ─── Section Config ─────────────────────────────────────────

/**
 * Everything a section needs to plug into the decision engine.
 *
 * TContent is the section's typed assembled output — e.g. for hero:
 * { headline: HeadlineOption; description: DescriptionOption; ... }
 */
export interface SectionConfig<TContent = Record<string, unknown>> {
  section_id: string;
  slots: string[];

  /** Look up allowed options for a state key */
  lookupMatrix: (stateKey: string) => MatrixEntry;

  /** Synchronous heuristic scoring */
  scoreDeterministic: (state: UserStateVector, entry: MatrixEntry) => ScoringResult;

  /** Build the prompt sent to AI for scoring */
  buildAIPrompt: (state: UserStateVector, stateKey: string, entry: MatrixEntry, ctx: VisitorContext, device: DeviceContext) => string;

  /** Parse raw AI JSON response into slot scores. Return null if invalid. */
  parseAIResponse: (raw: unknown) => Record<string, SlotScore[]> | null;

  /** Post-scoring guardrails */
  rules: Rule[];

  /** Pick winners from scored slots, resolve to typed content */
  assemble: (scores: Record<string, SlotScore[]>) => {
    content: TContent;
    selected_ids: Record<string, string>;
    rejected_ids: string[];
  };
}

// ─── Decision ───────────────────────────────────────────────

/**
 * The output of the decision engine for a single section.
 * Contains everything needed for rendering, debugging, and tracking.
 */
export interface Decision<TContent = Record<string, unknown>> {
  section_id: string;
  content: TContent;
  selected_ids: Record<string, string>;
  state_vector: UserStateVector;
  state_key: string;
  scoring: ScoringResult | null;
  selection_method: "ai" | "deterministic" | "fallback";
  rejected_ids: string[];
  rules_applied: string[];
  ai_error: string | null;
  snapshot_id: string;
  timestamp: number;
}
