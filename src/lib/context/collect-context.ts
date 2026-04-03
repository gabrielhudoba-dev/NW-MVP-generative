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

export interface VisitorContext {
  timeOfDay: TimeOfDay;
  isWeekend: boolean;
  isReturning: boolean;
  locale: string;
  language: string;
  country: string | null;
  weather: WeatherContext;
  acquisition: AcquisitionContext;
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

  return {
    timeOfDay: getTimeOfDay(),
    isWeekend: isWeekend(),
    isReturning,
    locale: getLocale(),
    language: getLanguage(),
    country: null,
    weather: { temp: null, condition: null, city: null },
    acquisition,
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
