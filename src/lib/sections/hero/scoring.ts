/**
 * Hero section scoring — deterministic rules from Content doc + AI prompt.
 */

import type { UserStateVector, SlotScore, ScoringResult, MatrixEntry } from "../../decision/types";
import type { VisitorContext } from "../../personalization";
import type { DeviceContext } from "../../analytics/device";
import { SCORING_VERSION } from "../../ai/openai-client";
import {
  HEADLINES_MAP,
  DESCRIPTIONS_MAP,
  CTAS_MAP,
  PROOFS_MAP,
} from "./content";
import type { HeadlineOption, DescriptionOption, CtaOption, ProofOption } from "./types";

// ─── Intent / Trust / Energy Buckets ───────────────────────

type IntentBucket = "exploring" | "evaluating" | "ready";
type TrustBucket = "low" | "medium" | "high";

function intentBucket(state: UserStateVector): IntentBucket {
  if (state.intent_score >= 0.6) return "ready";
  if (state.intent_score >= 0.35) return "evaluating";
  return "exploring";
}

function trustBucket(state: UserStateVector): TrustBucket {
  if (state.trust_score >= 0.5) return "high";
  if (state.trust_score >= 0.35) return "medium";
  return "low";
}

function highEnergy(state: UserStateVector): boolean {
  return state.energy_score >= 0.45;
}

// ─── Deterministic Scoring (Content Doc Rules) ─────────────

/**
 * Headline rules:
 * - exploring → problem headlines
 * - evaluating → authority headlines
 * - ready → action headline
 */
function scoreHeadline(id: string, state: UserStateVector): number {
  const h = HEADLINES_MAP[id];
  if (!h) return 0.4;

  const intent = intentBucket(state);

  const SCORE_MAP: Record<IntentBucket, Record<string, number>> = {
    exploring:  { problem: 0.8, authority: 0.35, action: 0.25 },
    evaluating: { authority: 0.8, problem: 0.4, action: 0.35 },
    ready:      { action: 0.9, authority: 0.45, problem: 0.3 },
  };

  let score = SCORE_MAP[intent][h.category] ?? 0.4;

  // Small differentiation within same category (prefer "a" variants slightly)
  if (id.endsWith("_b")) score -= 0.02;

  return Math.min(1, Math.max(0, score));
}

/**
 * Description rules:
 * - high energy → medium descriptions
 * - low energy → short descriptions
 */
function scoreDescription(id: string, state: UserStateVector): number {
  const d = DESCRIPTIONS_MAP[id];
  if (!d) return 0.4;

  const high = highEnergy(state);

  if (high) {
    return d.length === "medium" ? 0.8 : 0.35;
  } else {
    return d.length === "short" ? 0.8 : 0.3;
  }
}

/**
 * CTA rules:
 * - high trust + (evaluating | ready) → direct
 * - low trust → guided / soft
 * - exploring → guided
 */
function scoreCta(id: string, state: UserStateVector): number {
  const c = CTAS_MAP[id];
  if (!c) return 0.4;

  const intent = intentBucket(state);
  const trust = trustBucket(state);

  const PRESSURE_SCORES: Record<string, number> = {
    direct: 0.3,
    guided: 0.5,
    soft: 0.4,
    diagnostic: 0.4,
  };

  let score = PRESSURE_SCORES[c.pressure] ?? 0.4;

  // High trust + evaluating/ready → boost direct
  if ((trust === "high" || trust === "medium") && (intent === "evaluating" || intent === "ready")) {
    if (c.pressure === "direct") score = 0.85;
    else if (c.pressure === "diagnostic") score = 0.45;
  }

  // Low trust → prefer guided/soft
  if (trust === "low") {
    if (c.pressure === "guided") score = 0.75;
    else if (c.pressure === "soft") score = 0.65;
    else if (c.pressure === "diagnostic") score = 0.55;
    else if (c.pressure === "direct") score = 0.2;
  }

  // Exploring → prefer guided
  if (intent === "exploring") {
    if (c.pressure === "guided") score = Math.max(score, 0.75);
    if (c.pressure === "direct") score = Math.min(score, 0.25);
  }

  return Math.min(1, Math.max(0, score));
}

/**
 * Proof rules:
 * - low trust → showreel
 * - high trust + evaluating → kpi
 * - evaluating → argument
 * - low energy → none
 */
function scoreProof(id: string, state: UserStateVector): number {
  const p = PROOFS_MAP[id];
  if (!p) return 0.4;

  const intent = intentBucket(state);
  const trust = trustBucket(state);
  const high = highEnergy(state);

  // Default scores
  const BASE: Record<string, number> = {
    showreel: 0.45,
    kpi: 0.4,
    argument: 0.5,
    none: 0.35,
  };

  let score = BASE[p.type] ?? 0.4;

  // Low trust → showreel (visual proof builds trust)
  if (trust === "low") {
    if (p.type === "showreel") score = 0.8;
    else if (p.type === "argument") score = 0.4;
    else if (p.type === "kpi") score = 0.35;
  }

  // High trust + evaluating → kpi (they want data)
  if (trust === "high" && intent === "evaluating") {
    if (p.type === "kpi") score = 0.8;
    else if (p.type === "argument") score = 0.5;
    else if (p.type === "showreel") score = 0.35;
  }

  // Evaluating → argument works well
  if (intent === "evaluating" && trust !== "high" && trust !== "low") {
    if (p.type === "argument") score = 0.7;
  }

  // Low energy → prefer none
  if (!high) {
    if (p.type === "none") score = Math.max(score, 0.75);
    if (p.type === "showreel") score = Math.min(score, 0.3);
  }

  return Math.min(1, Math.max(0, score));
}

// ─── Public: Deterministic Scoring ─────────────────────────

export function heroScoreDeterministic(
  state: UserStateVector,
  entry: MatrixEntry
): ScoringResult {
  const start = Date.now();

  return {
    scores: {
      headline: (entry.allowed.headline ?? []).map((id) => ({
        id,
        score: scoreHeadline(id, state),
        reason: "deterministic",
      })),
      description: (entry.allowed.description ?? []).map((id) => ({
        id,
        score: scoreDescription(id, state),
        reason: "deterministic",
      })),
      cta: (entry.allowed.cta ?? []).map((id) => ({
        id,
        score: scoreCta(id, state),
        reason: "deterministic",
      })),
      proof: (entry.allowed.proof ?? []).map((id) => ({
        id,
        score: scoreProof(id, state),
        reason: "deterministic",
      })),
    },
    model: "deterministic",
    scoring_version: SCORING_VERSION,
    latency_ms: Date.now() - start,
  };
}

// ─── AI Prompt Builder (Content Doc Template) ──────────────

export function heroBuildAIPrompt(
  state: UserStateVector,
  stateKey: string,
  entry: MatrixEntry,
  ctx: VisitorContext,
  device: DeviceContext
): string {
  const headlines = (entry.allowed.headline ?? [])
    .map((id) => HEADLINES_MAP[id])
    .filter(Boolean)
    .map((h: HeadlineOption) => `  - id: "${h.id}", category: ${h.category}, text: "${h.text.replace(/\n/g, " / ")}"`)
    .join("\n");

  const descriptions = (entry.allowed.description ?? [])
    .map((id) => DESCRIPTIONS_MAP[id])
    .filter(Boolean)
    .map((d: DescriptionOption) => `  - id: "${d.id}", length: ${d.length}, text: "${d.text}"`)
    .join("\n");

  const ctas = (entry.allowed.cta ?? [])
    .map((id) => CTAS_MAP[id])
    .filter(Boolean)
    .map((c: CtaOption) => `  - id: "${c.id}", pressure: ${c.pressure}, label: "${c.label}"`)
    .join("\n");

  const proofs = (entry.allowed.proof ?? [])
    .map((id) => PROOFS_MAP[id])
    .filter(Boolean)
    .map((p: ProofOption) => `  - id: "${p.id}", type: ${p.type}, content: "${p.content}"`)
    .join("\n");

  return `GOAL: Maximize probability of booking_completed.

USER STATE VECTOR:
- intent_score: ${state.intent_score}
- trust_score: ${state.trust_score}
- energy_score: ${state.energy_score}
- decision_speed_score: ${state.decision_speed_score}
- attention_score: ${state.attention_score}
- familiarity_score: ${state.familiarity_score}

CONTEXT:
- visitor_type: ${ctx.isReturning ? "returning" : "new"}
- device_type: ${device.device_type}
- time_bucket: ${ctx.timeOfDay}
- referrer_group: ${ctx.acquisition.referrer_group}
- state_key: ${stateKey}

ALLOWED HEADLINE OPTIONS:
${headlines}

ALLOWED DESCRIPTION OPTIONS:
${descriptions}

ALLOWED CTA OPTIONS:
${ctas}

ALLOWED PROOF OPTIONS:
${proofs}

INSTRUCTIONS:
1. Score each option from 0 to 1 based on expected impact on booking_completed.
2. Consider alignment with: trust level, energy level, intent level.
3. Prefer clarity and relevance over creativity.
4. Do NOT invent or modify content.

Respond with ONLY valid JSON:
{
  "headline_scores": [{"id": "...", "score": 0.0}],
  "description_scores": [{"id": "...", "score": 0.0}],
  "cta_scores": [{"id": "...", "score": 0.0}],
  "proof_scores": [{"id": "...", "score": 0.0}]
}`;
}

// ─── AI Response Parser ─────────────────────────────────────

interface RawSlotScore {
  id: string;
  score: number;
  reason?: string;
}

interface RawAIScores {
  headline_scores?: RawSlotScore[];
  description_scores?: RawSlotScore[];
  cta_scores?: RawSlotScore[];
  proof_scores?: RawSlotScore[];
}

function withReason(scores: RawSlotScore[]): SlotScore[] {
  return scores.map((s) => ({ id: s.id, score: s.score, reason: s.reason ?? "ai" }));
}

export function heroParseAIResponse(raw: unknown): Record<string, SlotScore[]> | null {
  const d = raw as RawAIScores;

  if (
    !d.headline_scores?.length ||
    !d.description_scores?.length ||
    !d.cta_scores?.length ||
    !d.proof_scores?.length
  ) {
    console.warn("[hero] Invalid AI scoring response shape");
    return null;
  }

  return {
    headline: withReason(d.headline_scores),
    description: withReason(d.description_scores),
    cta: withReason(d.cta_scores),
    proof: withReason(d.proof_scores),
  };
}
