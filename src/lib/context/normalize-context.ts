/**
 * Context normalization helpers.
 *
 * Pure functions that derive normalized signals from raw browser/env data.
 * No side effects, no storage access.
 */

export type TimeOfDay = "morning" | "working" | "evening";

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return "morning";
  if (hour >= 9 && hour < 18) return "working";
  return "evening";
}

export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

export function getLocale(): string {
  return typeof navigator !== "undefined" ? navigator.language : "en-US";
}

export function getLanguage(): string {
  return getLocale().split("-")[0];
}
