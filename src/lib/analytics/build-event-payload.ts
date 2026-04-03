/**
 * Centralized event payload builder.
 *
 * Constructs tracking payloads from decision results.
 * Keeps tracking logic out of components.
 */

import type { PageDecision } from "../decision/types";
import type { VisitorContext } from "../context/collect-context";

export function buildTrackingContext(ctx: VisitorContext, decision: PageDecision) {
  return {
    visitor_type: ctx.isReturning ? "returning" : "new",
    time_bucket: ctx.timeOfDay,
    is_weekend: ctx.isWeekend,
    locale: ctx.locale,
    language: ctx.language,
    medium: ctx.acquisition.medium,
    utm_source: ctx.acquisition.utm_source,
    referrer_group: ctx.acquisition.referrer_group,

    // Hero
    headline_id: decision.hero.selected_ids.headline,
    description_id: decision.hero.selected_ids.description,
    cta_id: decision.hero.selected_ids.cta,
    proof_id: decision.hero.selected_ids.proof,
    state_key: decision.hero.state_key,
    snapshot_id: decision.snapshot_id,
    selection_method: decision.hero.selection_method,
    cta_label: decision.hero.content.cta.label,

    // Sections
    section_ids: decision.sections.section_ids.join(","),
    section_count: decision.sections.section_ids.length,
    section_method: decision.sections.selection_method,
  };
}

export function buildHeroVariantPayload(decision: PageDecision) {
  return {
    ...decision.hero.selected_ids,
    state_key: decision.hero.state_key,
    snapshot_id: decision.snapshot_id,
    selection_method: decision.hero.selection_method,
  };
}

export function buildSectionSequencePayload(decision: PageDecision) {
  return {
    section_ids: decision.sections.section_ids.join(","),
    section_count: decision.sections.section_ids.length,
    state_key: decision.sections.state_key,
    snapshot_id: decision.snapshot_id,
    selection_method: decision.sections.selection_method,
  };
}
