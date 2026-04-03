/**
 * Central event name constants.
 * Every tracked event in the project references this file.
 * No hardcoded event strings elsewhere.
 */
export const NW_EVENTS = {
  PAGE_VIEW: "nw_page_view",
  HERO_SEEN: "nw_hero_seen",
  HERO_VARIANT_SEEN: "nw_hero_variant_seen",
  PRIMARY_CTA_CLICKED: "nw_primary_cta_clicked",
  SECONDARY_CTA_CLICKED: "nw_secondary_cta_clicked",
  BOOKING_OPENED: "nw_booking_opened",
  BOOKING_STARTED: "nw_booking_started",
  BOOKING_COMPLETED: "nw_booking_completed",
  BOOKING_MODAL_CLOSED: "nw_booking_modal_closed",
  BOOKING_ABANDONED: "nw_booking_abandoned",
  SCROLL_BELOW_HERO: "nw_scroll_below_hero",
  SESSION_BOUNCED_FROM_HERO: "nw_session_bounced_from_hero",
  RETURN_VISITOR_DETECTED: "nw_return_visitor_detected",
  VARIANT_FORCED: "nw_variant_forced",
  DEBUG_MODE_OPENED: "nw_debug_mode_opened",
  TIME_TO_CTA_RECORDED: "nw_time_to_cta_recorded",
} as const;

export type NwEventName = (typeof NW_EVENTS)[keyof typeof NW_EVENTS];

/**
 * Experiment identity — constant for this MVP.
 */
export const EXPERIMENT = {
  name: "hero_mvp_v1",
  version: 1,
  page_version: "1.0.0",
} as const;
