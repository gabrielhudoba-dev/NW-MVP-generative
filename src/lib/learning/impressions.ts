/**
 * Per-variant impression tracking.
 *
 * Stored in localStorage ("nw_impressions").
 * Used to determine epsilon for epsilon-greedy exploration:
 *   if any variant in slot has < 500 impressions → higher exploration rate.
 */

const STORAGE_KEY = "nw_impressions";

type ImpressionStore = Record<string, Record<string, number>>;

function readStore(): ImpressionStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ImpressionStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

/** Returns impression count for a specific variant. */
export function getVariantImpressions(slot: string, variantId: string): number {
  const store = readStore();
  return store[slot]?.[variantId] ?? 0;
}

/** Returns minimum impressions across all variants in a slot. */
export function getSlotMinImpressions(slot: string, variantIds: string[]): number {
  const store = readStore();
  const slotStore = store[slot] ?? {};
  return Math.min(...variantIds.map((id) => slotStore[id] ?? 0));
}

/** Increments impression count for a variant. */
export function recordImpression(slot: string, variantId: string): void {
  const store = readStore();
  if (!store[slot]) store[slot] = {};
  store[slot][variantId] = (store[slot][variantId] ?? 0) + 1;
  writeStore(store);
}

/** Returns all impressions for a slot (for debug display). */
export function getSlotImpressions(slot: string): Record<string, number> {
  const store = readStore();
  return store[slot] ?? {};
}

/** Resets all impression counts (dev/test only). */
export function resetImpressions(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
