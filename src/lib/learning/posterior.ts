/**
 * Beta-Bernoulli posterior per (slot, variant).
 *
 * Stores alpha/beta parameters in localStorage ("nw_posteriors").
 * Cold start: alpha=1.0, beta=1.0 → posterior_mean = 0.5 (uniform / no preference).
 *
 * Posterior mean = alpha / (alpha + beta)
 * After a successful outcome with reward r: alpha += r, beta += (1 - r)
 *
 * Support events provide partial credit (r < 1.0):
 *   cta_clicked:           0.20
 *   booking_page_viewed:   0.35
 *   scroll_75:             0.10
 *   case_study_opened:     0.12
 *   time_engaged_45s:      0.08
 *   book_call_started:     1.00  (primary metric)
 */

const STORAGE_KEY = "nw_posteriors";

type PosteriorParams = { alpha: number; beta: number };
type PosteriorStore = Record<string, Record<string, PosteriorParams>>;

/** Partial credit weights for support events */
export const REWARD_WEIGHTS: Record<string, number> = {
  cta_clicked:           0.20,
  booking_page_viewed:   0.35,
  scroll_75:             0.10,
  case_study_opened:     0.12,
  time_engaged_45s:      0.08,
  book_call_started:     1.00,
};

// ─── Storage ─────────────────────────────────────────────────

function readStore(): PosteriorStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: PosteriorStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable
  }
}

function getParams(store: PosteriorStore, slot: string, variantId: string): PosteriorParams {
  return store[slot]?.[variantId] ?? { alpha: 1.0, beta: 1.0 };
}

// ─── Public API ──────────────────────────────────────────────

/** Returns the posterior mean E[θ] = alpha / (alpha + beta). */
export function getPosteriorMean(slot: string, variantId: string): number {
  const store = readStore();
  const { alpha, beta } = getParams(store, slot, variantId);
  return alpha / (alpha + beta);
}

/**
 * Updates the posterior for a variant after observing a reward.
 * reward ∈ [0, 1] — use REWARD_WEIGHTS for partial credit.
 */
export function updatePosterior(slot: string, variantId: string, reward: number): void {
  const store = readStore();
  if (!store[slot]) store[slot] = {};

  const params = getParams(store, slot, variantId);
  store[slot][variantId] = {
    alpha: params.alpha + reward,
    beta:  params.beta  + (1 - reward),
  };

  writeStore(store);
}

/** Returns full alpha/beta params (for debug display). */
export function getPosteriorParams(slot: string, variantId: string): PosteriorParams {
  const store = readStore();
  return getParams(store, slot, variantId);
}

/** Returns all posteriors for a given slot (for debug display). */
export function getSlotPosteriors(slot: string): Record<string, PosteriorParams & { mean: number }> {
  const store = readStore();
  const slotStore = store[slot] ?? {};
  const result: Record<string, PosteriorParams & { mean: number }> = {};
  for (const [id, params] of Object.entries(slotStore)) {
    result[id] = { ...params, mean: params.alpha / (params.alpha + params.beta) };
  }
  return result;
}

/** Resets all posteriors (dev/test only). */
export function resetPosteriors(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
