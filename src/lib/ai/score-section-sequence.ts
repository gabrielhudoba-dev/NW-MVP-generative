/**
 * AI section sequence scoring — builds prompt and parses response.
 *
 * The AI scores/ranks predefined sections. It never adds or removes sections.
 */

import type { UserStateVector } from "../state/state-types";
import type { SectionId } from "../content/content-types";
import type { VisitorContext } from "../context/collect-context";
import type { DeviceContext } from "../analytics/device";
import { SECTIONS_MAP } from "../content/sections";

export const SECTION_AI_SYSTEM_MESSAGE =
  "You are an expert in B2B conversion funnel optimization. Score the relevance and ordering priority of predefined page sections. Do NOT invent sections. Output only valid JSON.";

export function buildSectionAIPrompt(
  state: UserStateVector,
  stateKey: string,
  allowedSections: SectionId[],
  ctx: VisitorContext,
  device: DeviceContext
): string {
  const sectionList = allowedSections
    .map((id) => {
      const s = SECTIONS_MAP[id];
      if (!s) return null;
      return `  - id: "${s.id}", title: "${s.title}"`;
    })
    .filter(Boolean)
    .join("\n");

  return `GOAL: Maximize probability of booking_completed by ordering page sections optimally.

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

ALLOWED SECTIONS (in current order):
${sectionList}

INSTRUCTIONS:
1. Score each section from 0 to 1 based on how important it is for this visitor to see it.
2. Higher score = should appear earlier / is more critical.
3. A CTA section should generally be last.
4. Do NOT add or remove sections.

Respond with ONLY valid JSON:
{
  "section_scores": [{"id": "...", "score": 0.0}]
}`;
}
