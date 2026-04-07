/**
 * Centralized event payload builder.
 *
 * Constructs tracking payloads from the new PageDecision structure.
 */

import type { PageDecision } from "../decision/types";
import type { VisitorContext } from "../context/collect-context";

/** Full tracking context — set once via setTrackContext() to enrich all events. */
export function buildTrackingContext(ctx: VisitorContext, decision: PageDecision) {
  return {
    // Visitor
    visitor_type:   ctx.isReturning ? "returning" : "new",
    time_bucket:    ctx.timeOfDay,
    is_weekend:     ctx.isWeekend,
    locale:         ctx.locale,
    language:       ctx.language,
    medium:         ctx.acquisition.medium,
    utm_source:     ctx.acquisition.utm_source,
    referrer_group: ctx.acquisition.referrer_group,

    // Decision
    hero_variant:        decision.hero_variant,
    description_variant: decision.description_variant,
    proof_variant:       decision.proof_variant,
    cta_variant:         decision.cta_variant,
    section_sequence_id: decision.section_sequence_id,
    state_key:           decision.state_key,
    snapshot_id:         decision.snapshot_id,
    decision_mode:       decision.decision_mode,
    epsilon_value:       decision.epsilon_value,
    cta_label:           decision.content.cta.label,

    // Sections
    section_ids:   decision.sections.join(","),
    section_count: decision.sections.length,
  };
}

/** Exposure payload for PERSONALIZED_PAGE_SEEN event. */
export function buildExposurePayload(ctx: VisitorContext, decision: PageDecision) {
  return {
    session_id:          undefined, // enriched by track()
    visitor_type:        ctx.isReturning ? "returning" : "new",
    device:              undefined, // enriched by track()
    referrer_type:       ctx.acquisition.referrer_group,
    utm_source:          ctx.acquisition.utm_source,
    utm_medium:          ctx.acquisition.utm_medium,
    time_of_day:         ctx.timeOfDay,
    geo_region:          ctx.geo_region,
    intent:              decision.state.intent_score,
    trust:               decision.state.trust_score,
    energy:              decision.state.energy_score,
    attention:           decision.state.attention_score,
    familiarity:         decision.state.familiarity_score,
    hero_variant:        decision.hero_variant,
    description_variant: decision.description_variant,
    proof_variant:       decision.proof_variant,
    cta_variant:         decision.cta_variant,
    section_sequence_variant: decision.section_sequence_id,
    decision_mode:       decision.decision_mode,
    epsilon_value:       decision.epsilon_value,
  };
}

/** @deprecated Use buildExposurePayload + buildTrackingContext */
export function buildHeroVariantPayload(decision: PageDecision) {
  return {
    hero_variant:        decision.hero_variant,
    description_variant: decision.description_variant,
    cta_variant:         decision.cta_variant,
    proof_variant:       decision.proof_variant,
    state_key:           decision.state_key,
    snapshot_id:         decision.snapshot_id,
    decision_mode:       decision.decision_mode,
  };
}

/** @deprecated Use buildExposurePayload */
export function buildSectionSequencePayload(decision: PageDecision) {
  return {
    section_ids:         decision.sections.join(","),
    section_count:       decision.sections.length,
    section_sequence_id: decision.section_sequence_id,
    state_key:           decision.state_key,
    snapshot_id:         decision.snapshot_id,
  };
}
