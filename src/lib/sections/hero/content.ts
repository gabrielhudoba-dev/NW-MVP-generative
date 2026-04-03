/**
 * Hero section content — source of truth.
 *
 * All content from the approved "Content" document.
 * Do not add, remove, or rewrite entries without approval.
 */

import type { HeadlineOption, DescriptionOption, CtaOption, ProofOption } from "./types";

// ─── Headlines ──────────────────────────────────────────────

export const HEADLINES: HeadlineOption[] = [
  {
    id: "headline_problem_a",
    category: "problem",
    text: "Your product is growing.\nClarity is breaking.",
  },
  {
    id: "headline_problem_b",
    category: "problem",
    text: "Growth is not the problem.\nLoss of clarity is.",
  },
  {
    id: "headline_authority_a",
    category: "authority",
    text: "We define how digital products\nshould work.",
  },
  {
    id: "headline_authority_b",
    category: "authority",
    text: "Clarity, structure, and decisions\nthat hold at scale.",
  },
  {
    id: "headline_action_a",
    category: "action",
    text: "See where your product\nstarts to break.",
  },
];

// ─── Descriptions ───────────────────────────────────────────

export const DESCRIPTIONS: DescriptionOption[] = [
  {
    id: "desc_medium_a",
    length: "medium",
    text: "Native Works helps teams bring structure, clarity, and decision quality into complex digital products.",
  },
  {
    id: "desc_medium_b",
    length: "medium",
    text: "We help product teams define how systems should work before complexity turns into friction.",
  },
  {
    id: "desc_short_a",
    length: "short",
    text: "Structure before complexity breaks it.",
  },
  {
    id: "desc_short_b",
    length: "short",
    text: "Clarity that holds as you scale.",
  },
];

// ─── CTAs ───────────────────────────────────────────────────

export const CTAS: CtaOption[] = [
  { id: "cta_direct_a", label: "Book a call", pressure: "direct" },
  { id: "cta_guided_a", label: "See how we work", pressure: "guided" },
  { id: "cta_soft_a", label: "Talk to us", pressure: "soft" },
  { id: "cta_diagnostic_a", label: "Get a quick breakdown", pressure: "diagnostic" },
];

// ─── Proofs ─────────────────────────────────────────────────

export const PROOFS: ProofOption[] = [
  { id: "proof_showreel_a", type: "showreel", content: "Short showreel of product work (10–20s, fast cuts, UI + flows)" },
  { id: "proof_kpi_a", type: "kpi", content: "Reduced onboarding friction by 32% | Improved task completion by 21%" },
  { id: "proof_argument_a", type: "argument", content: "Most products don't break because of features. They break because decisions stop making sense at scale." },
  { id: "proof_none", type: "none", content: "" },
];

// ─── Lookup Maps ────────────────────────────────────────────

export const HEADLINES_MAP = Object.fromEntries(HEADLINES.map((h) => [h.id, h])) as Record<string, HeadlineOption>;
export const DESCRIPTIONS_MAP = Object.fromEntries(DESCRIPTIONS.map((d) => [d.id, d])) as Record<string, DescriptionOption>;
export const CTAS_MAP = Object.fromEntries(CTAS.map((c) => [c.id, c])) as Record<string, CtaOption>;
export const PROOFS_MAP = Object.fromEntries(PROOFS.map((p) => [p.id, p])) as Record<string, ProofOption>;
