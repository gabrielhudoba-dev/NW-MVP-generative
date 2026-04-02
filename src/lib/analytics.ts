import posthog from "posthog-js";
import type { VariantId } from "./variants";

export type AnalyticsEvent =
  | { name: "nw_hero_seen"; variant: VariantId }
  | { name: "nw_hero_variant_seen"; variant: VariantId; isReturning: boolean }
  | { name: "nw_primary_cta_clicked"; variant: VariantId }
  | { name: "nw_secondary_cta_clicked"; variant: VariantId }
  | { name: "nw_booking_opened"; variant: VariantId }
  | { name: "nw_booking_started"; variant: VariantId }
  | { name: "nw_booking_completed"; variant: VariantId }
  | { name: "nw_scroll_below_hero"; variant: VariantId }
  | { name: "nw_return_visitor_detected"; variant: VariantId }
  | { name: "nw_variant_forced"; variant: VariantId; source: string }
  | { name: "nw_debug_mode_opened"; variant: VariantId };

/**
 * Central analytics dispatcher — sends to PostHog + console in dev.
 *
 * All events use the nw_ prefix for easy filtering in PostHog.
 */
export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  const { name, ...properties } = event;

  // Console in dev
  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", name, properties);
  }

  // PostHog
  if (posthog.__loaded) {
    posthog.capture(name, properties);
  }

  // Persist to sessionStorage as fallback for MVP analysis
  try {
    const key = "nw_events";
    const existing = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    existing.push({ ...event, timestamp: Date.now() });
    sessionStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // storage full or unavailable
  }
}

/**
 * Sets up a one-time scroll observer that fires when the user
 * scrolls past the hero section.
 */
export function observeScrollBelowHero(
  heroElement: HTMLElement,
  variant: VariantId
): () => void {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry && !entry.isIntersecting) {
        track({ name: "nw_scroll_below_hero", variant });
        observer.disconnect();
      }
    },
    { threshold: 0 }
  );

  observer.observe(heroElement);
  return () => observer.disconnect();
}
