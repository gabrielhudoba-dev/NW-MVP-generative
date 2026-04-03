import { openaiChat, OPENAI_MODEL, SCORING_VERSION } from "./openai-client";
import type {
  UserStateVector,
  MatrixEntry,
  ScoringResult,
  SlotScore,
  HeadlineOption,
  DescriptionOption,
  CtaOption,
  ProofOption,
} from "../hero/types";
import { HEADLINES_MAP } from "../hero/matrix/headlines";
import { DESCRIPTIONS_MAP } from "../hero/matrix/descriptions";
import { CTAS_MAP } from "../hero/matrix/ctas";
import { PROOFS_MAP } from "../hero/matrix/proofs";

interface RawScoringResponse {
  headline_scores: { id: string; score: number; reason: string }[];
  description_scores: { id: string; score: number; reason: string }[];
  cta_scores: { id: string; score: number; reason: string }[];
  proof_scores: { id: string; score: number; reason: string }[];
}

function buildPrompt(
  state: UserStateVector,
  stateKey: string,
  entry: MatrixEntry
): string {
  const headlines = entry.allowed_headlines
    .map((id) => HEADLINES_MAP[id])
    .filter(Boolean)
    .map((h: HeadlineOption) => `  - id: "${h.id}", type: ${h.type}, tone: ${h.tone}, text: "${h.text.replace(/\n/g, " / ")}"`)
    .join("\n");

  const descriptions = entry.allowed_descriptions
    .map((id) => DESCRIPTIONS_MAP[id])
    .filter(Boolean)
    .map((d: DescriptionOption) => `  - id: "${d.id}", depth: ${d.depth}, text: "${d.text}"`)
    .join("\n");

  const ctas = entry.allowed_ctas
    .map((id) => CTAS_MAP[id])
    .filter(Boolean)
    .map((c: CtaOption) => `  - id: "${c.id}", pressure: ${c.pressure_level}, label: "${c.label}"`)
    .join("\n");

  const proofs = entry.allowed_proofs
    .map((id) => PROOFS_MAP[id])
    .filter(Boolean)
    .map((p: ProofOption) => `  - id: "${p.id}", type: ${p.type}, content: "${p.content}"`)
    .join("\n");

  return `You are a conversion optimization expert for a B2B digital product consultancy called Native Works.

Your task: score each content option for a landing page hero section. Score how well each option would convert this specific visitor to booking a call.

VISITOR STATE (0-1 scores):
- intent: ${state.intent_score} (how ready to act)
- trust: ${state.trust_score} (how much they trust us)
- energy: ${state.energy_score} (cognitive energy available)
- decision_speed: ${state.decision_speed_score} (how fast they decide)
- attention: ${state.attention_score} (how focused they are)
- familiarity: ${state.familiarity_score} (how well they know us)
- state_key: ${stateKey}

ALLOWED HEADLINE OPTIONS:
${headlines}

ALLOWED DESCRIPTION OPTIONS:
${descriptions}

ALLOWED CTA OPTIONS:
${ctas}

ALLOWED PROOF OPTIONS:
${proofs}

RULES:
- Score each option 0.0 to 1.0 based on predicted conversion for THIS visitor
- Higher intent+trust → direct CTAs; lower energy → shorter copy
- Lower trust → social proof + soft CTAs; higher familiarity → skip intro framing

Respond with ONLY valid JSON:
{
  "headline_scores": [{"id": "...", "score": 0.XX, "reason": "short"}],
  "description_scores": [{"id": "...", "score": 0.XX, "reason": "short"}],
  "cta_scores": [{"id": "...", "score": 0.XX, "reason": "short"}],
  "proof_scores": [{"id": "...", "score": 0.XX, "reason": "short"}]
}`;
}

/**
 * Ask OpenAI to score the allowed hero options for a given user state.
 * Returns null if OpenAI is unavailable.
 */
export async function scoreHeroOptions(
  state: UserStateVector,
  stateKey: string,
  entry: MatrixEntry
): Promise<ScoringResult | null> {
  const prompt = buildPrompt(state, stateKey, entry);

  const result = await openaiChat<RawScoringResponse>([
    { role: "system", content: "You are a conversion optimization scoring engine. Output only valid JSON." },
    { role: "user", content: prompt },
  ]);

  if (!result) return null;

  // Validate structure
  const d = result.data;
  if (!d.headline_scores?.length || !d.description_scores?.length || !d.cta_scores?.length || !d.proof_scores?.length) {
    console.warn("[ai] Invalid scoring response shape");
    return null;
  }

  return {
    headline_scores: d.headline_scores,
    description_scores: d.description_scores,
    cta_scores: d.cta_scores,
    proof_scores: d.proof_scores,
    model: result.model,
    scoring_version: SCORING_VERSION,
    latency_ms: result.latency_ms,
  };
}

/**
 * Deterministic fallback scoring — uses heuristics instead of AI.
 * Called when OpenAI is unavailable.
 */
export function scoreDeterministic(
  state: UserStateVector,
  entry: MatrixEntry
): ScoringResult {
  const start = Date.now();

  function scoreHeadline(id: string): number {
    const h = HEADLINES_MAP[id];
    if (!h) return 0.5;
    let score = 0.5;
    if (h.type === "problem" && state.energy_score > 0.5) score += 0.15;
    if (h.type === "authority" && state.trust_score > 0.4) score += 0.15;
    if (h.type === "action" && state.intent_score > 0.5) score += 0.2;
    if (h.type === "outcome" && state.familiarity_score > 0.3) score += 0.15;
    if (h.tone === "provocative" && state.energy_score < 0.4) score -= 0.15;
    if (h.tone === "calm" && state.energy_score < 0.4) score += 0.1;
    return Math.min(1, Math.max(0, score));
  }

  function scoreDescription(id: string): number {
    const d = DESCRIPTIONS_MAP[id];
    if (!d) return 0.5;
    let score = 0.5;
    if (d.depth === "minimal" && state.energy_score < 0.4) score += 0.2;
    if (d.depth === "minimal" && state.decision_speed_score > 0.6) score += 0.1;
    if (d.depth === "detailed" && state.energy_score > 0.6 && state.attention_score > 0.5) score += 0.15;
    if (d.depth === "standard") score += 0.05; // safe default
    if (id === "d_skip_intro" && state.familiarity_score > 0.4) score += 0.25;
    return Math.min(1, Math.max(0, score));
  }

  function scoreCta(id: string): number {
    const c = CTAS_MAP[id];
    if (!c) return 0.5;
    let score = 0.5;
    if (c.pressure_level === "urgent" && state.intent_score > 0.6) score += 0.2;
    if (c.pressure_level === "soft" && state.trust_score < 0.35) score += 0.15;
    if (c.pressure_level === "direct" && state.intent_score > 0.45 && state.trust_score > 0.4) score += 0.15;
    if (c.pressure_level === "guided") score += 0.05; // safe default
    return Math.min(1, Math.max(0, score));
  }

  function scoreProof(id: string): number {
    const p = PROOFS_MAP[id];
    if (!p) return 0.5;
    let score = 0.5;
    if (p.type === "social" && state.trust_score < 0.4) score += 0.2;
    if (p.type === "argument" && state.trust_score > 0.4) score += 0.1;
    if (p.type === "none" && state.energy_score < 0.35) score += 0.15;
    return Math.min(1, Math.max(0, score));
  }

  return {
    headline_scores: entry.allowed_headlines.map((id) => ({
      id,
      score: scoreHeadline(id),
      reason: "deterministic",
    })),
    description_scores: entry.allowed_descriptions.map((id) => ({
      id,
      score: scoreDescription(id),
      reason: "deterministic",
    })),
    cta_scores: entry.allowed_ctas.map((id) => ({
      id,
      score: scoreCta(id),
      reason: "deterministic",
    })),
    proof_scores: entry.allowed_proofs.map((id) => ({
      id,
      score: scoreProof(id),
      reason: "deterministic",
    })),
    model: "deterministic",
    scoring_version: SCORING_VERSION,
    latency_ms: Date.now() - start,
  };
}
