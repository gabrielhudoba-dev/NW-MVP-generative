/**
 * Central event name constants.
 * Every tracked event in the project references this file.
 * No hardcoded event strings elsewhere.
 */
export const NW_EVENTS = {
  // Page
  PAGE_VIEW: "nw_page_view",

  // Hero
  HERO_SEEN: "nw_hero_seen",
  HERO_VARIANT_SEEN: "nw_hero_variant_seen",
  HERO_STATE_DERIVED: "nw_hero_state_derived",
  HERO_OPTIONS_LOADED: "nw_hero_options_loaded",
  HERO_AI_SCORING_COMPLETED: "nw_hero_ai_scoring_completed",
  HERO_RULES_APPLIED: "nw_hero_rules_applied",
  HERO_VARIANT_SELECTED: "nw_hero_variant_selected",

  // Section sequence
  SECTION_SEQUENCE_LOADED: "nw_section_sequence_loaded",
  SECTION_AI_SCORING_COMPLETED: "nw_section_ai_scoring_completed",
  SECTION_RULES_APPLIED: "nw_section_rules_applied",
  SECTION_SEQUENCE_SELECTED: "nw_section_sequence_selected",

  // Funnel
  PRIMARY_CTA_CLICKED: "nw_primary_cta_clicked",
  SECONDARY_CTA_CLICKED: "nw_secondary_cta_clicked",
  BOOKING_OPENED: "nw_booking_opened",
  BOOKING_STARTED: "nw_booking_started",
  BOOKING_COMPLETED: "nw_booking_completed",
  BOOKING_MODAL_CLOSED: "nw_booking_modal_closed",
  BOOKING_ABANDONED: "nw_booking_abandoned",

  // Engagement
  SCROLL_BELOW_HERO: "nw_scroll_below_hero",
  SESSION_BOUNCED_FROM_HERO: "nw_session_bounced_from_hero",
  RETURN_VISITOR_DETECTED: "nw_return_visitor_detected",
  TIME_TO_CTA_RECORDED: "nw_time_to_cta_recorded",

  // Debug
  DEBUG_MODE_OPENED: "nw_debug_mode_opened",
} as const;

export type NwEventName = (typeof NW_EVENTS)[keyof typeof NW_EVENTS];

/**
 * Experiment identity — constant for this phase.
 */
export const EXPERIMENT = {
  name: "decision_v2",
  version: 2,
  page_version: "2.0.0",
} as const;
