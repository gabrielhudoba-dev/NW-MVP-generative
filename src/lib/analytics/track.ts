import posthog from "posthog-js";
import { type NwEventName, EXPERIMENT } from "./events";
import { detectDevice } from "./device";
import { getSessionId } from "./session";
import type { VariantId } from "../variants";

/**
 * Event-specific properties that callers pass in.
 * The enrichment layer adds device, session, experiment, etc.
 */
export interface TrackProperties {
  [key: string]: unknown;
}

const STORAGE_KEY = "nw_events";

/** Deduplication — prevents the same event from firing twice in one session. */
const firedOnce = new Set<string>();

/**
 * Track a one-time event (only fires once per session).
 * Use for impressions, detections, and other non-repeatable events.
 */
export function trackOnce(name: NwEventName, properties?: TrackProperties): void {
  if (firedOnce.has(name)) return;
  firedOnce.add(name);
  track(name, properties);
}

/**
 * Shared context that is set once per session and attached to every event.
 * Set via `setTrackContext()` after personalization resolves.
 */
let sharedContext: TrackProperties = {};

export function setTrackContext(ctx: TrackProperties): void {
  sharedContext = ctx;
}

/**
 * Central analytics dispatcher.
 *
 * Enriches every event with:
 * - session identity
 * - experiment identity
 * - device context
 * - page context
 * - shared visitor context (set via setTrackContext)
 *
 * Sends to PostHog and persists to sessionStorage for the dev panel.
 */
export function track(name: NwEventName, properties?: TrackProperties): void {
  if (typeof window === "undefined") return;

  const device = detectDevice();

  const enriched: TrackProperties = {
    // Experiment identity
    experiment_name: EXPERIMENT.name,
    experiment_version: EXPERIMENT.version,
    page_version: EXPERIMENT.page_version,
    session_id: getSessionId(),

    // Device context
    device_type: device.device_type,
    viewport_w: device.viewport_w,
    viewport_h: device.viewport_h,
    breakpoint_bucket: device.breakpoint_bucket,

    // Page context
    page: "hero",
    path: window.location.pathname,

    // Shared visitor context (variant, acquisition, weather, etc.)
    ...sharedContext,

    // Event-specific properties (override shared if needed)
    ...properties,
  };

  // Console in dev
  if (process.env.NODE_ENV === "development") {
    console.log(`[nw] ${name}`, enriched);
  }

  // PostHog
  const sentToPosthog = !!posthog.__loaded;
  if (sentToPosthog) {
    posthog.capture(name, enriched);
  }

  // Persist to sessionStorage for dev panel
  try {
    const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    existing.push({
      name,
      ...enriched,
      timestamp: Date.now(),
      status: sentToPosthog ? "sent" : "local",
    });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // storage full or unavailable
  }
}

/**
 * Sets up a one-time scroll observer that fires when the user
 * scrolls past the hero section.
 */
export function observeScrollBelowHero(heroElement: HTMLElement): () => void {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry && !entry.isIntersecting) {
        trackOnce("nw_scroll_below_hero");
        observer.disconnect();
      }
    },
    { threshold: 0 }
  );

  observer.observe(heroElement);
  return () => observer.disconnect();
}

/**
 * Timing utility — records milliseconds from hero mount to an action.
 */
let heroMountTime: number | null = null;

export function markHeroMount(): void {
  heroMountTime = Date.now();
}

export function getTimeSinceHeroMount(): number | null {
  if (!heroMountTime) return null;
  return Date.now() - heroMountTime;
}
