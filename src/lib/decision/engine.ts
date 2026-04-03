/**
 * Generic decision engine.
 *
 * Pipeline:
 *   1. Derive user state vector from context
 *   2. Derive state key for matrix lookup
 *   3. Load allowed options from section matrix
 *   4. Score options (AI or deterministic fallback)
 *   5. Apply section rules/guardrails
 *   6. Assemble final content from winning options
 *   7. Return decision metadata for tracking
 *
 * The engine is section-agnostic — all section-specific logic
 * lives in the SectionConfig provided by each section.
 */

import type { Decision, SectionConfig, ScoringResult, Rule, UserStateVector, SlotScore } from "./types";
import type { VisitorContext } from "../personalization";
import type { DeviceContext } from "../analytics/device";
import { deriveUserState, deriveStateKey } from "./derive-user-state";
import { openaiChat, SCORING_VERSION } from "../ai/openai-client";

// ─── Snapshot ID ────────────────────────────────────────────

let snapshotCounter = 0;

function generateSnapshotId(): string {
  return `snap_${Date.now()}_${++snapshotCounter}`;
}

// ─── Rules Engine ───────────────────────────────────────────

function applyRules(
  scores: Record<string, SlotScore[]>,
  rules: Rule[],
  state: UserStateVector,
  device: DeviceContext
): { scores: Record<string, SlotScore[]>; rules_applied: string[] } {
  const rules_applied: string[] = [];
  let current = structuredClone(scores);

  for (const rule of rules) {
    if (rule.condition(state, device)) {
      current = rule.apply(current);
      rules_applied.push(rule.id);
    }
  }

  return { scores: current, rules_applied };
}

// ─── Instant Deterministic Decision ─────────────────────────

/**
 * Synchronous, 0ms — always produces a result.
 * Used for instant first render before AI responds.
 */
export function runDecisionFast<T>(
  config: SectionConfig<T>,
  ctx: VisitorContext,
  device: DeviceContext
): Decision<T> {
  const state = deriveUserState(ctx, device);
  const stateKey = deriveStateKey(state);
  const entry = config.lookupMatrix(stateKey);

  let scoring = config.scoreDeterministic(state, entry);
  const { scores: filteredScores, rules_applied } = applyRules(
    scoring.scores,
    config.rules,
    state,
    device
  );
  scoring = { ...scoring, scores: filteredScores };

  let result;
  try {
    result = config.assemble(scoring.scores);
  } catch {
    const fallback = config.scoreDeterministic(state, entry);
    result = config.assemble(fallback.scores);
    scoring = fallback;
  }

  return {
    section_id: config.section_id,
    content: result.content,
    selected_ids: result.selected_ids,
    state_vector: state,
    state_key: stateKey,
    scoring,
    selection_method: "deterministic",
    rejected_ids: result.rejected_ids,
    rules_applied,
    ai_error: "deterministic-only (instant render)",
    snapshot_id: generateSnapshotId(),
    timestamp: Date.now(),
  };
}

// ─── Full Decision with AI Scoring ──────────────────────────

/**
 * Async — tries AI scoring, falls back to deterministic.
 * The hero already renders via runDecisionFast(); this upgrades it.
 */
export async function runDecision<T>(
  config: SectionConfig<T>,
  ctx: VisitorContext,
  device: DeviceContext,
  snapshotId?: string
): Promise<Decision<T>> {
  const state = deriveUserState(ctx, device);
  const stateKey = deriveStateKey(state);
  const entry = config.lookupMatrix(stateKey);

  let scoring: ScoringResult;
  let method: Decision<T>["selection_method"];
  let ai_error: string | null = null;

  // Try AI scoring
  const prompt = config.buildAIPrompt(state, stateKey, entry, ctx, device);
  const aiResult = await openaiChat<unknown>([
    { role: "system", content: "You are an expert in conversion optimization for B2B decision-making. Your task is to evaluate predefined content options and score their likelihood of leading to a booked call. Do NOT generate new copy. Only score provided options. Output only valid JSON." },
    { role: "user", content: prompt },
  ]);

  if (aiResult) {
    const parsed = config.parseAIResponse(aiResult.data);
    if (parsed) {
      scoring = {
        scores: parsed,
        model: aiResult.model,
        scoring_version: SCORING_VERSION,
        latency_ms: aiResult.latency_ms,
      };
      method = "ai";
    } else {
      scoring = config.scoreDeterministic(state, entry);
      method = "deterministic";
      ai_error = "AI response could not be parsed";
    }
  } else {
    scoring = config.scoreDeterministic(state, entry);
    method = "deterministic";
    ai_error = "AI returned null (fetch failed or invalid response)";
  }

  // Apply rules
  const { scores: filteredScores, rules_applied } = applyRules(
    scoring.scores,
    config.rules,
    state,
    device
  );
  scoring = { ...scoring, scores: filteredScores };

  // Assemble
  let result;
  try {
    result = config.assemble(scoring.scores);
  } catch (err) {
    console.warn(`[decision:${config.section_id}] Assembly failed, using fallback:`, err);
    const fallback = config.scoreDeterministic(state, entry);
    result = config.assemble(fallback.scores);
    method = "fallback";
    scoring = fallback;
  }

  return {
    section_id: config.section_id,
    content: result.content,
    selected_ids: result.selected_ids,
    state_vector: state,
    state_key: stateKey,
    scoring,
    selection_method: method,
    rejected_ids: result.rejected_ids,
    rules_applied,
    ai_error,
    snapshot_id: snapshotId ?? generateSnapshotId(),
    timestamp: Date.now(),
  };
}
