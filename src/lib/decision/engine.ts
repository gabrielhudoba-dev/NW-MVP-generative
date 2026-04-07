/**
 * Decision engine — probabilistic scoring with epsilon-greedy exploration.
 *
 * Pipeline (synchronous, 0ms):
 *   1. Derive state vector from visitor context
 *   2. Score all variants per slot (weighted sum prior + Beta-Bernoulli posterior)
 *   3. Apply soft constraints (multipliers) and hard guardrails (exclusions)
 *   4. Select variant per slot via epsilon-greedy
 *   5. Page-level reranking (incompatibilities + synergies)
 *   6. Record impressions
 *   7. Resolve content from IDs
 *
 * Falls back to preset mapping if all variants in the hero slot have < 150 impressions.
 *
 * Single public entry point: runPageDecision()
 * The old runPageDecisionFast() is aliased for backward compatibility.
 */

import type { VisitorContext } from "../context/collect-context";
import type { DeviceContext } from "../analytics/device";
import type { PageDecision, Slot, SlotScore, DecisionMode } from "./types";
import type { SectionId } from "../content/content-types";
import { deriveUserState } from "../state/derive-user-state";
import { deriveStateKey } from "../state/state-types";
import { scoreSlot } from "./score-variants";
import { getEpsilon, selectVariant } from "./exploration";
import { assembleWithReranking } from "./assembly";
import { findPreset, VARIANT_PRIORS } from "./variant-config";
import { recordImpression, getSlotMinImpressions } from "../learning/impressions";
import { HEADLINES_MAP } from "../content/headlines";
import { DESCRIPTIONS_MAP } from "../content/descriptions";
import { CTAS_MAP } from "../content/ctas";
import { PROOFS_MAP } from "../content/proofs";
import { SECTION_SEQUENCES } from "../content/section-sequences";

// ─── Snapshot ID ────────────────────────────────────────────

let snapshotCounter = 0;

function generateSnapshotId(): string {
  return `snap_${Date.now()}_${++snapshotCounter}`;
}

// ─── Preset Path ─────────────────────────────────────────────

function runPreset(
  ctx: VisitorContext,
  device: DeviceContext,
  snapshotId: string
): PageDecision | null {
  const state = deriveUserState(ctx, device);
  const preset = findPreset(state);
  if (!preset) return null;

  const heroVariantIds = Object.keys(VARIANT_PRIORS.hero);
  const minImpressions = getSlotMinImpressions("hero", heroVariantIds);
  if (minImpressions >= 150) return null; // enough data → use scoring

  const sections = resolveSequence(preset.section_sequence);

  const headline   = HEADLINES_MAP[preset.hero];
  const description = DESCRIPTIONS_MAP[preset.description];
  const cta        = CTAS_MAP[preset.cta];
  const proof      = PROOFS_MAP[preset.proof];

  if (!headline || !description || !cta || !proof) return null;

  return {
    content: { headline, description, cta, proof },
    hero_variant:             preset.hero,
    description_variant:      preset.description,
    proof_variant:            preset.proof,
    cta_variant:              preset.cta,
    section_sequence_id:      preset.section_sequence,
    sections,
    state:                    state,
    state_key:                deriveStateKey(state),
    decision_mode:            "preset",
    epsilon_value:            0,
    snapshot_id:              snapshotId,
    timestamp:                Date.now(),
    scores:                   {},
    constraints_applied:      ["cold_start_preset"],
  };
}

// ─── Scoring Path ─────────────────────────────────────────────

function runScoring(
  ctx: VisitorContext,
  device: DeviceContext,
  snapshotId: string
): PageDecision {
  const state     = deriveUserState(ctx, device);
  const stateKey  = deriveStateKey(state);

  const slots: Slot[] = ["hero", "description", "proof", "cta", "section_sequence"];

  // Score all slots
  const allScores: Partial<Record<Slot, SlotScore[]>> = {};
  const epsilonValues: number[] = [];
  const modes: DecisionMode[] = [];
  const initial: Partial<Record<Slot, SlotScore>> = {};

  for (const slot of slots) {
    const scores = scoreSlot(slot, state, ctx, device);
    allScores[slot] = scores;

    const variantIds = scores.map((s) => s.id);
    const epsilon = getEpsilon(ctx, variantIds, slot);
    const { selected, mode } = selectVariant(scores, epsilon);

    epsilonValues.push(epsilon);
    modes.push(mode);
    initial[slot] = selected;
  }

  // Page-level reranking
  const { selections, constraints_applied } = assembleWithReranking(
    allScores as Record<Slot, SlotScore[]>,
    initial as Record<Slot, SlotScore>
  );

  // Record impressions for selected variants
  for (const slot of slots) {
    recordImpression(slot, selections[slot].id);
  }

  // Resolve content
  const heroVariantId   = selections.hero.id;
  const descVariantId   = selections.description.id;
  const proofVariantId  = selections.proof.id;
  const ctaVariantId    = selections.cta.id;
  const seqId           = selections.section_sequence.id;

  const headline    = HEADLINES_MAP[heroVariantId];
  const description = DESCRIPTIONS_MAP[descVariantId];
  const cta         = CTAS_MAP[ctaVariantId];
  const proof       = PROOFS_MAP[proofVariantId];
  const sections    = resolveSequence(seqId);

  if (!headline || !description || !cta || !proof) {
    throw new Error(
      `Missing content: hero=${heroVariantId} desc=${descVariantId} cta=${ctaVariantId} proof=${proofVariantId}`
    );
  }

  // Dominant decision mode: prefer "explore" if any slot explored
  const decision_mode: DecisionMode = modes.includes("explore") ? "explore" : "exploit";
  const epsilon_value = Math.max(...epsilonValues);

  return {
    content: { headline, description, cta, proof },
    hero_variant:             heroVariantId,
    description_variant:      descVariantId,
    proof_variant:            proofVariantId,
    cta_variant:              ctaVariantId,
    section_sequence_id:      seqId,
    sections,
    state,
    state_key:                stateKey,
    decision_mode,
    epsilon_value,
    snapshot_id:              snapshotId,
    timestamp:                Date.now(),
    scores:                   allScores,
    constraints_applied,
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function resolveSequence(sequenceId: string): SectionId[] {
  return (SECTION_SEQUENCES[sequenceId] ?? []) as SectionId[];
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Main entry point — synchronous, 0ms.
 *
 * Uses preset mapping if impressions are below cold-start threshold (< 150 per variant).
 * Otherwise runs full probabilistic scoring + epsilon-greedy + assembly reranking.
 */
export function runPageDecision(
  ctx: VisitorContext,
  device: DeviceContext
): PageDecision {
  const snapshotId = generateSnapshotId();
  return runPreset(ctx, device, snapshotId) ?? runScoring(ctx, device, snapshotId);
}

/** @deprecated Alias for backward compatibility. Use runPageDecision(). */
export const runPageDecisionFast = runPageDecision;
