/**
 * Deterministic hero scoring — Content doc rules.
 *
 * Scores each allowed option per slot based on the user state vector.
 * Returns scores, NOT final selections. Assembly happens separately.
 */

import type { UserStateVector } from "../state/state-types";
import type { SlotScore, ScoringResult } from "./types";
import type { HeroMatrixEntry } from "../matrix/hero-matrix";
import { intentBucket, trustBucket, energyBucket, type IntentBucket } from "../state/state-types";
import { HEADLINES_MAP } from "../content/headlines";
import { DESCRIPTIONS_MAP } from "../content/descriptions";
import { CTAS_MAP } from "../content/ctas";
import { PROOFS_MAP } from "../content/proofs";
import { SCORING_VERSION } from "../ai/openai-client";

// ─── Headline Rules ─────────────────────────────────────────
// exploring → problem | evaluating → authority | ready → action

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
  if (id.endsWith("_b")) score -= 0.02;
  return clamp(score);
}

// ─── Description Rules ──────────────────────────────────────
// high energy → medium | low energy → short

function scoreDescription(id: string, state: UserStateVector): number {
  const d = DESCRIPTIONS_MAP[id];
  if (!d) return 0.4;

  if (energyBucket(state) === "high") {
    return d.length === "medium" ? 0.8 : 0.35;
  }
  return d.length === "short" ? 0.8 : 0.3;
}

// ─── CTA Rules ──────────────────────────────────────────────
// high trust + evaluating/ready → direct | low trust → guided/soft

function scoreCta(id: string, state: UserStateVector): number {
  const c = CTAS_MAP[id];
  if (!c) return 0.4;

  const intent = intentBucket(state);
  const trust = trustBucket(state);

  const BASE: Record<string, number> = {
    direct: 0.3, guided: 0.5, soft: 0.4, diagnostic: 0.4,
  };

  let score = BASE[c.pressure] ?? 0.4;

  if ((trust === "high" || trust === "medium") && (intent === "evaluating" || intent === "ready")) {
    if (c.pressure === "direct") score = 0.85;
    else if (c.pressure === "diagnostic") score = 0.45;
  }

  if (trust === "low") {
    if (c.pressure === "guided") score = 0.75;
    else if (c.pressure === "soft") score = 0.65;
    else if (c.pressure === "diagnostic") score = 0.55;
    else if (c.pressure === "direct") score = 0.2;
  }

  if (intent === "exploring") {
    if (c.pressure === "guided") score = Math.max(score, 0.75);
    if (c.pressure === "direct") score = Math.min(score, 0.25);
  }

  return clamp(score);
}

// ─── Proof Rules ────────────────────────────────────────────
// low trust → showreel | high trust + evaluating → kpi | new user → showreel_kpi

function scoreProof(id: string, state: UserStateVector): number {
  const p = PROOFS_MAP[id];
  if (!p) return 0.4;

  const intent = intentBucket(state);
  const trust = trustBucket(state);
  const energy = energyBucket(state);

  const BASE: Record<string, number> = {
    showreel: 0.45, kpi: 0.4, argument: 0.5, none: 0.35, showreel_kpi: 0.4,
  };

  let score = BASE[p.type] ?? 0.4;

  // New user → combined proof
  if (state.familiarity_score < 0.3) {
    if (p.type === "showreel_kpi") score = 0.9;
    else if (p.type === "showreel") score = 0.55;
    else if (p.type === "kpi") score = 0.5;
  }

  // Low trust → showreel
  if (trust === "low" && state.familiarity_score >= 0.3) {
    if (p.type === "showreel") score = 0.8;
    else if (p.type === "argument") score = 0.4;
    else if (p.type === "kpi") score = 0.35;
  }

  // High trust + evaluating → kpi
  if (trust === "high" && intent === "evaluating") {
    if (p.type === "kpi") score = 0.8;
    else if (p.type === "argument") score = 0.5;
    else if (p.type === "showreel") score = 0.35;
    if (p.type === "showreel_kpi") score = Math.max(score, 0.5);
  }

  // Evaluating + medium trust → argument
  if (intent === "evaluating" && trust === "medium") {
    if (p.type === "argument") score = 0.7;
  }

  // Low energy → prefer none
  if (energy === "low") {
    if (p.type === "none") score = Math.max(score, 0.75);
    if (p.type === "showreel") score = Math.min(score, 0.3);
    if (p.type === "showreel_kpi") score = Math.min(score, 0.35);
  }

  return clamp(score);
}

// ─── Public API ─────────────────────────────────────────────

export function scoreHeroDeterministic(
  state: UserStateVector,
  matrix: HeroMatrixEntry
): ScoringResult {
  const start = Date.now();

  return {
    scores: {
      headline: matrix.headline.map((id) => ({
        id, score: scoreHeadline(id, state), reason: "deterministic",
      })),
      description: matrix.description.map((id) => ({
        id, score: scoreDescription(id, state), reason: "deterministic",
      })),
      cta: matrix.cta.map((id) => ({
        id, score: scoreCta(id, state), reason: "deterministic",
      })),
      proof: matrix.proof.map((id) => ({
        id, score: scoreProof(id, state), reason: "deterministic",
      })),
    },
    model: "deterministic",
    scoring_version: SCORING_VERSION,
    latency_ms: Date.now() - start,
  };
}

function clamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}
