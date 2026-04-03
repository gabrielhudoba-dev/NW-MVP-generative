import type { HeroDecision } from "../hero/types";
import type { VisitorContext } from "../personalization";
import type { DeviceContext } from "../analytics/device";
import { deriveUserState, deriveStateKey } from "./derive-user-state";
import { lookupMatrix } from "../hero/matrix/state-matrix";
import { scoreHeroOptions, scoreDeterministic } from "../ai/score-hero-options";
import { applyRules } from "./rules-filter";
import { assembleHero } from "./assemble-hero";

/**
 * Full hero selection pipeline:
 *
 * 1. Derive user state vector from context
 * 2. Derive state key for matrix lookup
 * 3. Load allowed options from matrix
 * 4. Score options (AI or deterministic fallback)
 * 5. Apply rules/guardrails
 * 6. Assemble final hero from winning options
 * 7. Return full decision metadata for tracking
 *
 * If AI scoring fails, falls back to deterministic scoring.
 * The hero ALWAYS renders — never breaks.
 */
export async function selectHero(
  ctx: VisitorContext,
  device: DeviceContext
): Promise<HeroDecision> {
  // Step 1 — derive user state
  const state = deriveUserState(ctx, device);

  // Step 2 — derive state key
  const stateKey = deriveStateKey(state);

  // Step 3 — load matrix
  const entry = lookupMatrix(stateKey);

  // Step 4 — score (AI with fast timeout, deterministic fallback)
  // Race: give AI 5s max, otherwise use deterministic instantly
  const AI_RACE_MS = 5000;

  let scoring: ReturnType<typeof scoreDeterministic>;
  let method: HeroDecision["selection_method"];

  const aiPromise = scoreHeroOptions(state, stateKey, entry);
  const raceResult = await Promise.race([
    aiPromise.then((r) => ({ source: "ai" as const, result: r })),
    new Promise<{ source: "timeout"; result: null }>((resolve) =>
      setTimeout(() => resolve({ source: "timeout", result: null }), AI_RACE_MS)
    ),
  ]);

  if (raceResult.source === "ai" && raceResult.result) {
    scoring = raceResult.result;
    method = "ai";
  } else {
    scoring = scoreDeterministic(state, entry);
    method = raceResult.source === "timeout" ? "deterministic" : "deterministic";
  }

  // Step 5 — apply rules
  const filtered = applyRules(
    {
      headline_scores: scoring.headline_scores,
      description_scores: scoring.description_scores,
      cta_scores: scoring.cta_scores,
      proof_scores: scoring.proof_scores,
    },
    state,
    device
  );

  // Update scoring with filtered results
  scoring = {
    ...scoring,
    headline_scores: filtered.headline_scores,
    description_scores: filtered.description_scores,
    cta_scores: filtered.cta_scores,
    proof_scores: filtered.proof_scores,
  };

  // Step 6 — assemble
  let result;
  try {
    result = assembleHero(scoring);
  } catch (err) {
    // Ultimate fallback — if assembly fails, use deterministic and retry
    console.warn("[decision] Assembly failed, using fallback:", err);
    const fallback = scoreDeterministic(state, entry);
    result = assembleHero(fallback);
    method = "fallback";
    scoring = fallback;
  }

  // Step 7 — return decision
  return {
    assembled: result.assembled,
    state_vector: state,
    state_key: stateKey,
    scoring,
    selection_method: method,
    selected_ids: result.selected_ids,
    rejected_ids: result.rejected_ids,
    timestamp: Date.now(),
  };
}

/**
 * Fast re-score using deterministic only.
 * Used for real-time updates when behavior signals change.
 */
export function reselectHeroFast(
  ctx: VisitorContext,
  device: DeviceContext
): HeroDecision {
  const state = deriveUserState(ctx, device);
  const stateKey = deriveStateKey(state);
  const entry = lookupMatrix(stateKey);
  let scoring = scoreDeterministic(state, entry);

  const filtered = applyRules(
    {
      headline_scores: scoring.headline_scores,
      description_scores: scoring.description_scores,
      cta_scores: scoring.cta_scores,
      proof_scores: scoring.proof_scores,
    },
    state,
    device
  );

  scoring = {
    ...scoring,
    headline_scores: filtered.headline_scores,
    description_scores: filtered.description_scores,
    cta_scores: filtered.cta_scores,
    proof_scores: filtered.proof_scores,
  };

  let result;
  try {
    result = assembleHero(scoring);
  } catch {
    const fallback = scoreDeterministic(state, entry);
    result = assembleHero(fallback);
    scoring = fallback;
  }

  return {
    assembled: result.assembled,
    state_vector: state,
    state_key: stateKey,
    scoring,
    selection_method: "deterministic",
    selected_ids: result.selected_ids,
    rejected_ids: result.rejected_ids,
    timestamp: Date.now(),
  };
}
