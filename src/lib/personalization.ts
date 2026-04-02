import type { VariantId } from "./variants";

export interface WeatherContext {
  temp: number | null;
  condition: string | null;
  city: string | null;
}

export interface VisitorContext {
  variant: VariantId;
  timeOfDay: "morning" | "working" | "evening";
  isReturning: boolean;
  locale: string;
  country: string | null;
  weather: WeatherContext;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
  };
}

const STORAGE_KEY = "nw_visitor";
const VARIANT_KEY = "nw_variant";

interface StoredVisitor {
  firstSeen: number;
  visits: number;
  variant: VariantId;
}

function getTimeOfDay(): VisitorContext["timeOfDay"] {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return "morning";
  if (hour >= 9 && hour < 18) return "working";
  return "evening";
}

function getUtmParams(): VisitorContext["utm"] {
  if (typeof window === "undefined") {
    return { source: null, medium: null, campaign: null };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
  };
}

/**
 * Picks variant based on UTM or assigns randomly with sticky persistence.
 */
function resolveVariant(utm: VisitorContext["utm"]): VariantId {
  // UTM-based overrides
  if (utm.source === "linkedin" || utm.medium === "social") return "B";
  if (utm.source === "google" || utm.medium === "cpc") return "C";
  if (utm.campaign?.includes("product")) return "A";

  // Check persisted variant
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(VARIANT_KEY);
    if (stored === "A" || stored === "B" || stored === "C") return stored;
  }

  // Random assignment, weighted equally
  const roll = Math.random();
  if (roll < 0.33) return "A";
  if (roll < 0.66) return "B";
  return "C";
}

/**
 * Detects full visitor context. Call on mount (client-side).
 */
export function detectVisitorContext(): VisitorContext {
  const utm = getUtmParams();
  const variant = resolveVariant(utm);

  let isReturning = false;

  if (typeof window !== "undefined") {
    // Persist variant
    localStorage.setItem(VARIANT_KEY, variant);

    // Track visits
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored: StoredVisitor = raw
        ? JSON.parse(raw)
        : { firstSeen: Date.now(), visits: 0, variant };

      stored.visits += 1;
      isReturning = stored.visits > 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // localStorage unavailable — treat as new
    }
  }

  const locale =
    typeof navigator !== "undefined" ? navigator.language : "en-US";

  return {
    variant,
    timeOfDay: getTimeOfDay(),
    isReturning,
    locale,
    country: null, // MVP: could use Accept-Language or IP-based geo later
    weather: { temp: null, condition: null, city: null },
    utm,
  };
}

/**
 * Fetches weather based on browser geolocation.
 * Uses wttr.in — free, no API key, no signup.
 * Returns null fields if unavailable.
 */
export async function detectWeather(): Promise<WeatherContext> {
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
 * Resolves the country from server-side headers (Vercel provides this).
 * Call from a server component or middleware.
 */
export function getCountryFromHeaders(
  headers: Headers
): string | null {
  return headers.get("x-vercel-ip-country") ?? null;
}
