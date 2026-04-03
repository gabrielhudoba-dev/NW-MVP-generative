/**
 * Acquisition context: UTM parsing and referrer normalization.
 */

export type ReferrerGroup = "direct" | "social" | "search" | "referral" | "email" | "unknown";

export interface AcquisitionContext {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  referrer_group: ReferrerGroup;
}

const SOCIAL_DOMAINS = ["linkedin.com", "twitter.com", "x.com", "facebook.com", "instagram.com", "threads.net", "reddit.com", "youtube.com"];
const SEARCH_DOMAINS = ["google.", "bing.com", "duckduckgo.com", "yahoo.", "baidu.com", "yandex."];
const EMAIL_DOMAINS = ["mail.google.com", "outlook.live.com", "outlook.office.com"];

function normalizeReferrerGroup(referrer: string | null, utmMedium: string | null): ReferrerGroup {
  if (utmMedium === "email") return "email";
  if (utmMedium === "social") return "social";
  if (utmMedium === "cpc" || utmMedium === "ppc") return "search";

  if (!referrer) return "direct";

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (EMAIL_DOMAINS.some((d) => hostname.includes(d))) return "email";
    if (SOCIAL_DOMAINS.some((d) => hostname.includes(d))) return "social";
    if (SEARCH_DOMAINS.some((d) => hostname.includes(d))) return "search";
    // If referrer exists but is from a different domain, it's a referral
    if (typeof window !== "undefined" && hostname !== window.location.hostname) {
      return "referral";
    }
  } catch {
    // malformed referrer
  }

  return "unknown";
}

export function detectAcquisition(): AcquisitionContext {
  if (typeof window === "undefined") {
    return { utm_source: null, utm_medium: null, utm_campaign: null, referrer: null, referrer_group: "direct" };
  }

  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get("utm_source");
  const utm_medium = params.get("utm_medium");
  const utm_campaign = params.get("utm_campaign");
  const referrer = document.referrer || null;

  return {
    utm_source,
    utm_medium,
    utm_campaign,
    referrer,
    referrer_group: normalizeReferrerGroup(referrer, utm_medium),
  };
}
