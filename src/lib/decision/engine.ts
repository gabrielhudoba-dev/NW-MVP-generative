/**
 * Decision engine — orchestrates the full decision pipeline.
 *
 * Pipeline:
 *   1. Collect context → derive state vector
 *   2. Load allowed options (matrix / sequence config)
 *   3. Score options (deterministic)
 *   4. Apply guardrails
 *   5. Assemble final content
 *   6. (Async) AI scoring upgrade
 *
 * Two entry points:
 *   - runPageDecisionFast()  — synchronous, deterministic only
 *   - runPageDecision()      — async, tries AI upgrade
 */

import type { UserStateVector } from "../state/state-types";
import type { VisitorContext } from "../context/collect-context";
import type { DeviceContext } from "../analytics/device";
import type { HeroDecision, SectionSequenceDecision, PageDecision, ScoringResult } from "./types";
import { deriveUserState } from "../state/derive-user-state";
import { deriveStateKey } from "../state/state-types";
import { loadHeroMatrix } from "../matrix/hero-matrix";
import { scoreHeroDeterministic } from "./select-hero";
import { applyHeroGuardrails } from "./apply-guardrails";
import { assembleHero } from "./assemble-hero";
import { selectSectionsDeterministic, applySectionAIScores } from "./select-sections";
import { openaiChat, SCORING_VERSION } from "../ai/openai-client";
import { buildHeroAIPrompt, HERO_AI_SYSTEM_MESSAGE } from "../ai/score-hero-options";
import { buildSectionAIPrompt, SECTION_AI_SYSTEM_MESSAGE } from "../ai/score-section-sequence";
import { parseHeroAIResponse, parseSectionAIResponse } from "../ai/schemas";

// ─── Snapshot ID ────────────────────────────────────────────

let snapshotCounter = 0;

function generateSnapshotId(): string {
  return `snap_${Date.now()}_${++snapshotCounter}`;
}

// ─── Hero Decision (Deterministic) ──────────────────────────

function runHeroDeterministic(
  state: UserStateVector,
  stateKey: string,
  device: DeviceContext,
  snapshotId: string
): HeroDecision {
  const matrix = loadHeroMatrix(stateKey);
  let scoring = scoreHeroDeterministic(state, matrix);

  const { scores: filteredScores, rules_applied } = applyHeroGuardrails(
    scoring.scores, state, device
  );
  scoring = { ...scoring, scores: filteredScores };

  let result;
  try {
    result = assembleHero(scoring.scores);
  } catch {
    const fallback = scoreHeroDeterministic(state, matrix);
    result = assembleHero(fallback.scores);
    scoring = fallback;
  }

  return {
    content: result.content,
    selected_ids: result.selected_ids,
    state_vector: state,
    state_key: stateKey,
    scoring,
    selection_method: "deterministic",
    rejected_ids: result.rejected_ids,
    rules_applied,
    ai_error: "deterministic-only (instant render)",
    snapshot_id: snapshotId,
    timestamp: Date.now(),
  };
}

// ─── Hero Decision (AI) ────────────────────────────────────

async function runHeroAI(
  state: UserStateVector,
  stateKey: string,
  ctx: VisitorContext,
  device: DeviceContext,
  snapshotId: string
): Promise<HeroDecision> {
  const matrix = loadHeroMatrix(stateKey);

  let scoring: ScoringResult;
  let method: HeroDecision["selection_method"];
  let ai_error: string | null = null;

  const prompt = buildHeroAIPrompt(state, stateKey, matrix, ctx, device);
  const aiResult = await openaiChat<unknown>([
    { role: "system", content: HERO_AI_SYSTEM_MESSAGE },
    { role: "user", content: prompt },
  ]);

  if (aiResult) {
    const parsed = parseHeroAIResponse(aiResult.data);
    if (parsed) {
      scoring = {
        scores: parsed,
        model: aiResult.model,
        scoring_version: SCORING_VERSION,
        latency_ms: aiResult.latency_ms,
      };
      method = "ai";
    } else {
      scoring = scoreHeroDeterministic(state, matrix);
      method = "deterministic";
      ai_error = "AI response could not be parsed";
    }
  } else {
    scoring = scoreHeroDeterministic(state, matrix);
    method = "deterministic";
    ai_error = "AI returned null (fetch failed or invalid response)";
  }

  const { scores: filteredScores, rules_applied } = applyHeroGuardrails(
    scoring.scores, state, device
  );
  scoring = { ...scoring, scores: filteredScores };

  let result;
  try {
    result = assembleHero(scoring.scores);
  } catch (err) {
    console.warn("[engine] Hero assembly failed, using fallback:", err);
    const fallback = scoreHeroDeterministic(state, matrix);
    result = assembleHero(fallback.scores);
    method = "fallback";
    scoring = fallback;
  }

  return {
    content: result.content,
    selected_ids: result.selected_ids,
    state_vector: state,
    state_key: stateKey,
    scoring,
    selection_method: method,
    rejected_ids: result.rejected_ids,
    rules_applied,
    ai_error,
    snapshot_id: snapshotId,
    timestamp: Date.now(),
  };
}

// ─── Section Sequence (AI) ──────────────────────────────────

async function runSectionsAI(
  state: UserStateVector,
  stateKey: string,
  ctx: VisitorContext,
  device: DeviceContext,
  baseSections: SectionSequenceDecision
): Promise<SectionSequenceDecision> {
  const prompt = buildSectionAIPrompt(state, stateKey, baseSections.section_ids, ctx, device);
  const aiResult = await openaiChat<unknown>([
    { role: "system", content: SECTION_AI_SYSTEM_MESSAGE },
    { role: "user", content: prompt },
  ]);

  if (aiResult) {
    const parsed = parseSectionAIResponse(aiResult.data);
    if (parsed) {
      return applySectionAIScores(baseSections, parsed);
    }
  }

  return baseSections;
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Synchronous, 0ms — instant first render.
 * Deterministic hero + deterministic section sequence.
 */
export function runPageDecisionFast(
  ctx: VisitorContext,
  device: DeviceContext
): PageDecision {
  const state = deriveUserState(ctx, device);
  const stateKey = deriveStateKey(state);
  const snapshotId = generateSnapshotId();

  const hero = runHeroDeterministic(state, stateKey, device, snapshotId);
  const sections = selectSectionsDeterministic(state, ctx.isReturning, snapshotId);

  return { hero, sections, snapshot_id: snapshotId, timestamp: Date.now() };
}

/**
 * Async — tries AI scoring for both hero and sections.
 * Falls back to deterministic if AI fails.
 */
export async function runPageDecision(
  ctx: VisitorContext,
  device: DeviceContext,
  snapshotId?: string
): Promise<PageDecision> {
  const state = deriveUserState(ctx, device);
  const stateKey = deriveStateKey(state);
  const sid = snapshotId ?? generateSnapshotId();

  // Run hero AI and section base in parallel
  const baseSections = selectSectionsDeterministic(state, ctx.isReturning, sid);

  const [hero, sections] = await Promise.all([
    runHeroAI(state, stateKey, ctx, device, sid),
    runSectionsAI(state, stateKey, ctx, device, baseSections),
  ]);

  return { hero, sections, snapshot_id: sid, timestamp: Date.now() };
}
