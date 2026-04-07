/**
 * Context collection — gathers all visitor signals into a single object.
 *
 * Replaces the old personalization.ts.
 * No variant assignment — the decision engine handles selection.
 */

import type { AcquisitionContext } from "../analytics/acquisition";
import { detectAcquisition } from "../analytics/acquisition";
import { getTimeOfDay, isWeekend, getLocale, getLanguage, type TimeOfDay } from "./normalize-context";

// ─── Types ──────────────────────────────────────────────────

export interface WeatherContext {
  temp: number | null;
  condition: string | null;
  city: string | null;
}

export type GeoRegion = "eu" | "us" | "uk" | "other" | "unknown";

export interface VisitorContext {
  timeOfDay: TimeOfDay;
  isWeekend: boolean;
  isReturning: boolean;
  locale: string;
  language: string;
  country: string | null;
  geo_region: GeoRegion;
  weather: WeatherContext;
  acquisition: AcquisitionContext;
  /** 0–1 scroll depth at time of decision (updated live) */
  scroll_depth: number;
  /** Seconds on page at time of decision (updated live) */
  time_on_page_sec: number;
  /** Pages viewed in this session */
  pages_seen_session: number;
  /** Case study views in this session */
  case_study_views_session: number;
  /** Booking page views in this session */
  booking_page_views_session: number;
}

// ─── Storage ────────────────────────────────────────────────

const STORAGE_KEY = "nw_visitor";

interface StoredVisitor {
  firstSeen: number;
  visits: number;
}

// ─── Collection ─────────────────────────────────────────────

/**
 * Detects full visitor context. Call once on mount (client-side only).
 */
export function collectContext(): VisitorContext {
  const acquisition = detectAcquisition();
  let isReturning = false;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored: StoredVisitor = raw
        ? JSON.parse(raw)
        : { firstSeen: Date.now(), visits: 0 };

      stored.visits += 1;
      isReturning = stored.visits > 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // localStorage unavailable
    }
  }

  // ── Session counters (sessionStorage) ──
  let pages_seen_session = 1;
  let case_study_views_session = 0;
  let booking_page_views_session = 0;
  if (typeof window !== "undefined") {
    try {
      pages_seen_session = parseInt(sessionStorage.getItem("nw_pages") ?? "0", 10) + 1;
      sessionStorage.setItem("nw_pages", String(pages_seen_session));
      case_study_views_session = parseInt(sessionStorage.getItem("nw_case_study_views") ?? "0", 10);
      booking_page_views_session = parseInt(sessionStorage.getItem("nw_booking_views") ?? "0", 10);
    } catch {
      // sessionStorage unavailable
    }
  }

  return {
    timeOfDay: getTimeOfDay(),
    isWeekend: isWeekend(),
    isReturning,
    locale: getLocale(),
    language: getLanguage(),
    country: null,
    geo_region: "unknown",
    weather: { temp: null, condition: null, city: null },
    acquisition,
    scroll_depth: 0,
    time_on_page_sec: 0,
    pages_seen_session,
    case_study_views_session,
    booking_page_views_session,
  };
}

/**
 * Fetches weather based on IP location via wttr.in.
 * Non-blocking, no API key needed.
 */
export async function fetchWeather(): Promise<WeatherContext> {
  const empty: WeatherContext = { temp: null, condition: null, city: null };
  if (typeof window === "undefined") return empty;

  try {
    const res = await fetch("https://wttr.in/?format=j1", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return empty;

    const data = await res.json();
    const current = data.current_condition?.[0];
    const area = data.nearest_area?.[0];

    return {
      temp: current?.temp_C ? Number(current.temp_C) : null,
      condition: current?.weatherDesc?.[0]?.value ?? null,
      city: area?.areaName?.[0]?.value ?? null,
    };
  } catch {
    return empty;
  }
}

/**
 * Resolves country from server-side headers (Vercel).
 */
export function getCountryFromHeaders(headers: Headers): string | null {
  return headers.get("x-vercel-ip-country") ?? null;
}
