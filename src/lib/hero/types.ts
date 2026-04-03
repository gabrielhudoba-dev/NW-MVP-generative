/**
 * Core types for the hero decision system.
 */

// ─── User State Vector ───────────────────────────────────────

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

// ─── Content Slot Items ──────────────────────────────────────

export type HeadlineType = "problem" | "authority" | "action" | "outcome";
export type HeadlineTone = "sharp" | "calm" | "direct" | "provocative";

export interface HeadlineOption {
  id: string;
  label: string;
  text: string;
  type: HeadlineType;
  tone: HeadlineTone;
  intended_use: string;
}

export type DescriptionDepth = "minimal" | "standard" | "detailed";

export interface DescriptionOption {
  id: string;
  text: string;
  depth: DescriptionDepth;
  intended_use: string;
}

export type CtaType = "book" | "learn" | "explore";
export type CtaPressure = "soft" | "guided" | "direct" | "urgent";

export interface CtaOption {
  id: string;
  label: string;
  type: CtaType;
  pressure_level: CtaPressure;
}

export type ProofType = "argument" | "kpi" | "social" | "none";

export interface ProofOption {
  id: string;
  type: ProofType;
  label: string;
  content: string;
}

// ─── Matrix Entry ────────────────────────────────────────────

export interface MatrixEntry {
  state_key: string;
  allowed_headlines: string[];
  allowed_descriptions: string[];
  allowed_ctas: string[];
  allowed_proofs: string[];
}

// ─── Scoring ─────────────────────────────────────────────────

export interface SlotScore {
  id: string;
  score: number;
  reason: string;
}

export interface ScoringResult {
  headline_scores: SlotScore[];
  description_scores: SlotScore[];
  cta_scores: SlotScore[];
  proof_scores: SlotScore[];
  model: string;
  scoring_version: string;
  latency_ms: number;
}

// ─── Assembled Hero ──────────────────────────────────────────

export interface AssembledHero {
  headline: HeadlineOption;
  description: DescriptionOption;
  cta: CtaOption;
  proof: ProofOption;
}

export interface HeroDecision {
  assembled: AssembledHero;
  state_vector: UserStateVector;
  state_key: string;
  scoring: ScoringResult | null;
  selection_method: "ai" | "deterministic" | "fallback";
  selected_ids: {
    headline_id: string;
    description_id: string;
    cta_id: string;
    proof_id: string;
  };
  rejected_ids: string[];
  rules_applied: string[];
  ai_error: string | null;
  snapshot_id: string;
  timestamp: number;
}
