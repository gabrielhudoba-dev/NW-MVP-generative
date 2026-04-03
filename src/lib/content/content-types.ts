/**
 * Content type definitions for the entire website decision system.
 *
 * These types describe the shape of approved content entries.
 * All actual content lives in separate files per slot.
 */

// ─── Hero Slot Types ────────────────────────────────────────

export type HeadlineCategory = "problem" | "authority" | "action";

export interface HeadlineOption {
  id: string;
  category: HeadlineCategory;
  text: string;
}

export type DescriptionLength = "medium" | "short";

export interface DescriptionOption {
  id: string;
  length: DescriptionLength;
  text: string;
}

export type CtaPressure = "direct" | "guided" | "soft" | "diagnostic";

export interface CtaOption {
  id: string;
  label: string;
  pressure: CtaPressure;
}

export type ProofType = "showreel" | "kpi" | "argument" | "none" | "showreel_kpi";

export interface ProofOption {
  id: string;
  type: ProofType;
  content: string;
}

// ─── Assembled Hero Content ─────────────────────────────────

export interface HeroContent {
  headline: HeadlineOption;
  description: DescriptionOption;
  cta: CtaOption;
  proof: ProofOption;
}

// ─── Section Types ──────────────────────────────────────────

export type SectionId =
  | "shift"
  | "consequence"
  | "market_shift"
  | "position"
  | "position_light"
  | "working_model"
  | "intervention_logic"
  | "business_model"
  | "proof_showreel"
  | "proof_kpi"
  | "proof_argument"
  | "proof_optional"
  | "cta_soft"
  | "cta_direct";

export interface SectionContent {
  id: SectionId;
  title: string;
  body: string;
  /** Optional CTA label for CTA-type sections */
  ctaLabel?: string;
  /** Optional proof reference for proof-type sections */
  proofRef?: string;
}
