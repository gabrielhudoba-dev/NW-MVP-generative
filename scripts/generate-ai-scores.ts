/**
 * Precompute AI hero scores for all 54 state×device combinations.
 *
 * Run: npm run generate-scores
 * Output: src/lib/ai/precomputed-scores.ts
 *
 * Regenerate whenever content library changes (headlines, descriptions, ctas, proofs).
 * One-time cost: 54 combos × ~984 input tokens ≈ 53k tokens total.
 * Runtime cost after: 0 API calls.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import OpenAI from "openai";

import { buildHeroAIPrompt, HERO_AI_SYSTEM_MESSAGE } from "@/lib/ai/score-hero-options";
import { loadHeroMatrix } from "@/lib/matrix/hero-matrix";
import type { UserStateVector } from "@/lib/state/state-types";
import type { VisitorContext } from "@/lib/context/collect-context";
import type { DeviceContext, DeviceType } from "@/lib/analytics/device";
import type { PrecomputedHeroScores } from "@/lib/ai/precomputed-scores";

// ─── Config ──────────────────────────────────────────────────

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.3;
const MAX_TOKENS = 600;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// ─── OpenAI client (direct, server-side) ─────────────────────

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("❌  OPENAI_API_KEY is not set. Export it before running.");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

// ─── State combinations ───────────────────────────────────────

type IntentBucket = "exploring" | "evaluating" | "ready";
type TrustBucket = "low" | "medium" | "high";
type EnergyBucket = "low" | "high";

const INTENT_BUCKETS: IntentBucket[] = ["exploring", "evaluating", "ready"];
const TRUST_BUCKETS: TrustBucket[] = ["low", "medium", "high"];
const ENERGY_BUCKETS: EnergyBucket[] = ["low", "high"];
const DEVICE_TYPES: DeviceType[] = ["desktop", "mobile", "tablet"];

/** Representative midpoint value for each bucket. */
function intentScore(b: IntentBucket): number {
  return b === "ready" ? 0.75 : b === "evaluating" ? 0.47 : 0.18;
}
function trustScore(b: TrustBucket): number {
  return b === "high" ? 0.68 : b === "medium" ? 0.42 : 0.20;
}
function energyScore(b: EnergyBucket): number {
  return b === "high" ? 0.65 : 0.28;
}

function makeStateVector(intent: IntentBucket, trust: TrustBucket, energy: EnergyBucket): UserStateVector {
  const i = intentScore(intent);
  const t = trustScore(trust);
  const e = energyScore(energy);
  return {
    intent_score: i,
    trust_score: t,
    energy_score: e,
    decision_speed_score: Math.min(1, i * 0.8 + 0.1),
    attention_score: Math.min(1, e * 0.7 + t * 0.2),
    familiarity_score: trust === "high" ? 0.55 : trust === "medium" ? 0.25 : 0.08,
  };
}

function makeVisitorContext(intent: IntentBucket, trust: TrustBucket): VisitorContext {
  const isReturning = trust === "high";
  const referrer_group = trust === "high" ? "direct" : intent === "ready" ? "search" : "direct";
  return {
    timeOfDay: "working",
    isWeekend: false,
    isReturning,
    locale: "en-US",
    language: "en",
    country: null,
    weather: { temp: null, condition: null, city: null },
    acquisition: {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referrer: null,
      referrer_group,
      medium: referrer_group,
    },
  };
}

function makeDeviceContext(deviceType: DeviceType): DeviceContext {
  const w = deviceType === "mobile" ? 390 : deviceType === "tablet" ? 768 : 1440;
  const breakpoint = deviceType === "mobile" ? "mobile" : deviceType === "tablet" ? "tablet" : "desktop";
  return {
    device_type: deviceType,
    viewport_w: w,
    viewport_h: 844,
    breakpoint_bucket: breakpoint as DeviceContext["breakpoint_bucket"],
  };
}

// ─── AI scoring ───────────────────────────────────────────────

async function scoreOnce(
  state: UserStateVector,
  stateKey: string,
  ctx: VisitorContext,
  device: DeviceContext,
): Promise<PrecomputedHeroScores | null> {
  const matrix = loadHeroMatrix(stateKey);
  const prompt = buildHeroAIPrompt(state, stateKey, matrix, ctx, device);

  const start = Date.now();
  try {
    const res = await client.responses.create({
      model: MODEL,
      input: [
        { role: "system", content: HERO_AI_SYSTEM_MESSAGE },
        { role: "user", content: prompt },
      ],
      temperature: TEMPERATURE,
      max_output_tokens: MAX_TOKENS,
      text: { format: { type: "json_object" } },
    });

    const content = res.output_text;
    if (!content) return null;

    const data = JSON.parse(content);
    const latency_ms = Date.now() - start;

    return {
      headline_scores: data.headline_scores ?? [],
      description_scores: data.description_scores ?? [],
      cta_scores: data.cta_scores ?? [],
      proof_scores: data.proof_scores ?? [],
      model: MODEL,
      latency_ms,
    };
  } catch (err) {
    console.warn(`  ⚠️  API error for ${stateKey}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Content hash ─────────────────────────────────────────────

function computeContentHash(): string {
  const files = [
    "src/lib/content/headlines.ts",
    "src/lib/content/descriptions.ts",
    "src/lib/content/ctas.ts",
    "src/lib/content/proofs.ts",
  ].map((f) => readFileSync(join(ROOT, f), "utf-8"));

  return createHash("sha256").update(files.join("\n---\n")).digest("hex").slice(0, 16);
}

// ─── TypeScript output serializer ────────────────────────────

function serializeScores(scores: PrecomputedHeroScores): string {
  const slots = (arr: PrecomputedHeroScores["headline_scores"]) =>
    "[" +
    arr
      .map(
        (s) =>
          `{ id: "${s.id}", score: ${s.score.toFixed(3)}${s.reason ? `, reason: "${s.reason.replace(/"/g, '\\"')}"` : ""} }`
      )
      .join(", ") +
    "]";

  return `{
    headline_scores: ${slots(scores.headline_scores)},
    description_scores: ${slots(scores.description_scores)},
    cta_scores: ${slots(scores.cta_scores)},
    proof_scores: ${slots(scores.proof_scores)},
    model: "${scores.model}",
    latency_ms: ${scores.latency_ms},
  }`;
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("🔄  Generating precomputed AI hero scores...\n");

  const contentHash = computeContentHash();
  console.log(`📦  Content hash: ${contentHash}`);
  console.log(`🤖  Model: ${MODEL}`);

  const totalCombos = INTENT_BUCKETS.length * TRUST_BUCKETS.length * ENERGY_BUCKETS.length * DEVICE_TYPES.length;
  console.log(`📊  Combos: ${totalCombos} (${INTENT_BUCKETS.length} intent × ${TRUST_BUCKETS.length} trust × ${ENERGY_BUCKETS.length} energy × ${DEVICE_TYPES.length} devices)\n`);

  const entries: Array<{ key: string; scores: PrecomputedHeroScores }> = [];
  let failed = 0;

  for (const intent of INTENT_BUCKETS) {
    for (const trust of TRUST_BUCKETS) {
      for (const energy of ENERGY_BUCKETS) {
        const stateKey = `${intent}_${trust}_${energy}`;
        const state = makeStateVector(intent, trust, energy);
        const ctx = makeVisitorContext(intent, trust);

        for (const deviceType of DEVICE_TYPES) {
          const cacheKey = `${stateKey}_${deviceType}`;
          const device = makeDeviceContext(deviceType);

          process.stdout.write(`  ${cacheKey}... `);
          const scores = await scoreOnce(state, stateKey, ctx, device);

          if (scores) {
            entries.push({ key: cacheKey, scores });
            console.log(`✓ (${scores.latency_ms}ms)`);
          } else {
            console.log(`✗ (failed — will fall back to deterministic at runtime)`);
            failed++;
          }

          // Small delay to avoid rate limiting
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
  }

  console.log(`\n✅  ${entries.length}/${totalCombos} entries generated${failed ? ` (${failed} failed)` : ""}`);

  // Build cache entries string
  const cacheEntries = entries
    .map(({ key, scores }) => `  "${key}": ${serializeScores(scores)},`)
    .join("\n\n");

  const now = new Date().toISOString();

  const output = `/**
 * Precomputed AI hero scores — generated offline for all state×device combos.
 *
 * AUTO-GENERATED by scripts/generate-ai-scores.ts
 * Run: npm run generate-scores
 *
 * Regenerate whenever content library changes (headlines, descriptions, ctas, proofs).
 * Cache key format: "{intent}_{trust}_{energy}_{deviceType}"
 */

export interface PrecomputedSlotScore {
  id: string;
  score: number;
  reason?: string;
}

/** Shape matches RawHeroAIResponse so parseHeroAIResponse() works directly on this. */
export interface PrecomputedHeroScores {
  headline_scores: PrecomputedSlotScore[];
  description_scores: PrecomputedSlotScore[];
  cta_scores: PrecomputedSlotScore[];
  proof_scores: PrecomputedSlotScore[];
  model: string;
  latency_ms: number;
}

/** SHA-256 of concatenated content source files at generation time. */
export const CONTENT_HASH = "${contentHash}";

/** ISO timestamp of last generation. */
export const GENERATED_AT = "${now}";

/**
 * Lookup table: cache_key → precomputed hero scores (pre-guardrail).
 * Guardrails are still applied at runtime (instantaneous, no cost).
 */
export const AI_SCORE_CACHE: Record<string, PrecomputedHeroScores> = {
${cacheEntries}
};
`;

  const outPath = join(ROOT, "src/lib/ai/precomputed-scores.ts");
  writeFileSync(outPath, output, "utf-8");
  console.log(`\n📝  Written to: src/lib/ai/precomputed-scores.ts`);
  console.log(`🎉  Done! ${entries.length} combos cached. Runtime AI calls: 0.\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
