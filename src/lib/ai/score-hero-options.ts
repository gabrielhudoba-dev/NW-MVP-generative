/**
 * AI hero scoring — builds the prompt and parses the response.
 *
 * The AI scores predefined options only. It never generates new content.
 */

import type { UserStateVector } from "../state/state-types";
import type { VisitorContext } from "../context/collect-context";
import type { DeviceContext } from "../analytics/device";
import type { HeroMatrixEntry } from "../matrix/hero-matrix";
import { HEADLINES_MAP } from "../content/headlines";
import { DESCRIPTIONS_MAP } from "../content/descriptions";
import { CTAS_MAP } from "../content/ctas";
import { PROOFS_MAP } from "../content/proofs";
import type { HeadlineOption, DescriptionOption, CtaOption, ProofOption } from "../content/content-types";

export const HERO_AI_SYSTEM_MESSAGE =
  "You are an expert in conversion optimization for B2B decision-making. Your task is to evaluate predefined content options and score their likelihood of leading to a booked call. Do NOT generate new copy. Only score provided options. Output only valid JSON.";

export function buildHeroAIPrompt(
  state: UserStateVector,
  stateKey: string,
  matrix: HeroMatrixEntry,
  ctx: VisitorContext,
  device: DeviceContext
): string {
  const headlines = matrix.headline
    .map((id) => HEADLINES_MAP[id])
    .filter(Boolean)
    .map((h: HeadlineOption) => `  - id: "${h.id}", category: ${h.category}, text: "${h.text}"`)
    .join("\n");

  const descriptions = matrix.description
    .map((id) => DESCRIPTIONS_MAP[id])
    .filter(Boolean)
    .map((d: DescriptionOption) => `  - id: "${d.id}", length: ${d.length}, text: "${d.text}"`)
    .join("\n");

  const ctas = matrix.cta
    .map((id) => CTAS_MAP[id])
    .filter(Boolean)
    .map((c: CtaOption) => `  - id: "${c.id}", pressure: ${c.pressure}, label: "${c.label}"`)
    .join("\n");

  const proofs = matrix.proof
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
