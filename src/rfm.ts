import type {
  RFMBreakdown,
  RFMConfig,
  RFMScore,
  RFMTier,
  CustomerMetrics,
  ScoreThresholds,
  CurrencyPreset,
} from './types.js';

// ─── Default thresholds ───────────────────────────────────────────────────────

/**
 * Default recency boundaries [d5, d4, d3, d2] in days:
 *   ≤ 7 → 5 | ≤ 30 → 4 | ≤ 90 → 3 | ≤ 180 → 2 | else → 1
 */
const DEFAULT_RECENCY_THRESHOLDS: ScoreThresholds = {
  boundaries: [7, 30, 90, 180],
};

/**
 * Default frequency boundaries [c2, c3, c4, c5] in purchase count:
 *   ≥ 10 → 5 | ≥ 7 → 4 | ≥ 4 → 3 | ≥ 2 → 2 | else → 1
 */
const DEFAULT_FREQUENCY_THRESHOLDS: ScoreThresholds = {
  boundaries: [2, 4, 7, 10],
};

/**
 * USD monetary boundaries [m2, m3, m4, m5] in dollars:
 *   ≥ $1,000 → 5 | ≥ $500 → 4 | ≥ $200 → 3 | ≥ $50 → 2 | else → 1
 */
const USD_MONETARY_THRESHOLDS: ScoreThresholds = {
  boundaries: [50, 200, 500, 1000],
};

/**
 * INR monetary boundaries [m2, m3, m4, m5] in rupees (~83× USD):
 *   ≥ ₹83,000 → 5 | ≥ ₹41,500 → 4 | ≥ ₹16,600 → 3 | ≥ ₹4,000 → 2 | else → 1
 */
const INR_MONETARY_THRESHOLDS: ScoreThresholds = {
  boundaries: [4000, 16600, 41500, 83000],
};

/** Built-in currency presets for monetary scoring. */
export const CURRENCY_PRESETS: Record<CurrencyPreset, ScoreThresholds> = {
  USD: USD_MONETARY_THRESHOLDS,
  INR: INR_MONETARY_THRESHOLDS,
};

/** The default config used when none is supplied (USD monetary thresholds). */
export const DEFAULT_RFM_CONFIG: Required<RFMConfig> = {
  recency: DEFAULT_RECENCY_THRESHOLDS,
  frequency: DEFAULT_FREQUENCY_THRESHOLDS,
  monetary: USD_MONETARY_THRESHOLDS,
};

// ─── Internal validation ──────────────────────────────────────────────────────

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${label} must be a finite non-negative number, got: ${value}`,
    );
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  assertFiniteNonNegative(value, label);
  if (!Number.isInteger(value)) {
    throw new RangeError(`${label} must be an integer, got: ${value}`);
  }
}

/**
 * Validates that custom ScoreThresholds boundaries are four strictly-ascending
 * finite non-negative numbers. Called only when the caller provides custom
 * thresholds — defaults are valid by construction.
 */
function validateBoundaries(thresholds: ScoreThresholds, label: string): void {
  const [b1, b2, b3, b4] = thresholds.boundaries;
  if (
    !Number.isFinite(b1) ||
    !Number.isFinite(b2) ||
    !Number.isFinite(b3) ||
    !Number.isFinite(b4) ||
    b1 < 0 ||
    b2 <= b1 ||
    b3 <= b2 ||
    b4 <= b3
  ) {
    throw new RangeError(
      `${label} boundaries must be four strictly-ascending non-negative numbers, ` +
        `got: [${thresholds.boundaries.join(', ')}]`,
    );
  }
}

// ─── Scoring internals ────────────────────────────────────────────────────────

/**
 * Higher value = higher score (frequency, monetary).
 * boundaries = [b12, b23, b34, b45]:
 *   value >= b45 → 5 | >= b34 → 4 | >= b23 → 3 | >= b12 → 2 | else → 1
 */
function scoreAscending(value: number, thresholds: ScoreThresholds): RFMScore {
  const [b12, b23, b34, b45] = thresholds.boundaries;
  if (value >= b45) return 5;
  if (value >= b34) return 4;
  if (value >= b23) return 3;
  if (value >= b12) return 2;
  return 1;
}

/**
 * Lower value = higher score (recency in days).
 * boundaries = [d45, d34, d23, d12]:
 *   value <= d45 → 5 | <= d34 → 4 | <= d23 → 3 | <= d12 → 2 | else → 1
 */
function scoreDescending(value: number, thresholds: ScoreThresholds): RFMScore {
  const [d45, d34, d23, d12] = thresholds.boundaries;
  if (value <= d45) return 5;
  if (value <= d34) return 4;
  if (value <= d23) return 3;
  if (value <= d12) return 2;
  return 1;
}

// ─── Public scoring functions ─────────────────────────────────────────────────

/**
 * Scores purchase recency on a 1–5 scale (5 = most recent).
 *
 * Default bands (days since last purchase):
 *   0–7    → 5
 *   8–30   → 4
 *   31–90  → 3
 *   91–180 → 2
 *   181+   → 1
 *
 * @param daysSinceLastPurchase - Non-negative days. Fractional values allowed
 *   (e.g. 0.5 for a purchase 12 hours ago).
 * @param thresholds - Optional custom `[d5, d4, d3, d2]` day boundaries.
 *   Must be four strictly-ascending non-negative numbers.
 * @returns RFM recency score, 1–5.
 * @throws {RangeError} If input is negative, NaN, or non-finite.
 * @throws {RangeError} If custom boundaries are not strictly ascending.
 */
export function scoreRecency(
  daysSinceLastPurchase: number,
  thresholds?: ScoreThresholds,
): RFMScore {
  assertFiniteNonNegative(daysSinceLastPurchase, 'daysSinceLastPurchase');
  if (thresholds !== undefined) validateBoundaries(thresholds, 'recency');
  return scoreDescending(
    daysSinceLastPurchase,
    thresholds ?? DEFAULT_RECENCY_THRESHOLDS,
  );
}

/**
 * Scores purchase frequency on a 1–5 scale (5 = most frequent).
 *
 * Default bands (total purchases):
 *   10+  → 5
 *   7–9  → 4
 *   4–6  → 3
 *   2–3  → 2
 *   0–1  → 1
 *
 * @param purchaseCount - Non-negative integer purchase count.
 * @param thresholds - Optional custom `[c2, c3, c4, c5]` count boundaries.
 *   Must be four strictly-ascending non-negative numbers.
 * @returns RFM frequency score, 1–5.
 * @throws {RangeError} If input is negative, NaN, non-finite, or fractional.
 * @throws {RangeError} If custom boundaries are not strictly ascending.
 */
export function scoreFrequency(
  purchaseCount: number,
  thresholds?: ScoreThresholds,
): RFMScore {
  assertNonNegativeInteger(purchaseCount, 'purchaseCount');
  if (thresholds !== undefined) validateBoundaries(thresholds, 'frequency');
  return scoreAscending(
    purchaseCount,
    thresholds ?? DEFAULT_FREQUENCY_THRESHOLDS,
  );
}

/**
 * Scores monetary value on a 1–5 scale (5 = highest spend).
 *
 * Default USD bands (total lifetime spend):
 *   ≥ $1,000 → 5
 *   ≥ $500   → 4
 *   ≥ $200   → 3
 *   ≥ $50    → 2
 *   < $50    → 1
 *
 * INR preset scales at ~83× the USD values (₹83,000+ → 5, etc.).
 *
 * @param totalSpend - Non-negative spend in major currency units.
 * @param thresholds - Optional `ScoreThresholds` object for full control, or a
 *   `CurrencyPreset` string ('USD' | 'INR') for built-in calibrations.
 *   Defaults to USD when omitted.
 * @returns RFM monetary score, 1–5.
 * @throws {RangeError} If spend is negative, NaN, or non-finite.
 * @throws {RangeError} If a custom threshold object has non-monotone boundaries.
 * @throws {RangeError} If an unknown currency preset string is passed.
 */
export function scoreMonetary(
  totalSpend: number,
  thresholds?: ScoreThresholds | CurrencyPreset,
): RFMScore {
  assertFiniteNonNegative(totalSpend, 'totalSpend');

  let resolved: ScoreThresholds;
  if (thresholds === undefined) {
    resolved = USD_MONETARY_THRESHOLDS;
  } else if (typeof thresholds === 'string') {
    const preset = CURRENCY_PRESETS[thresholds];
    if (!preset) {
      throw new RangeError(
        `Unknown currency preset: "${thresholds}". ` +
          `Valid values: ${Object.keys(CURRENCY_PRESETS).join(', ')}`,
      );
    }
    resolved = preset;
  } else {
    validateBoundaries(thresholds, 'monetary');
    resolved = thresholds;
  }

  return scoreAscending(totalSpend, resolved);
}

// ─── Tier mapping ─────────────────────────────────────────────────────────────

/**
 * Maps a composite RFM score (3–15) to its named quality band.
 *
 * 13–15 → 'excellent'
 * 10–12 → 'good'
 *  7–9  → 'average'
 *  5–6  → 'below-average'
 *  3–4  → 'poor'
 *
 * @param score - Integer composite score, must be in the range 3–15 inclusive.
 * @returns The named RFM tier.
 * @throws {RangeError} If score is outside 3–15, not an integer, or NaN.
 */
export function getRFMTier(score: number): RFMTier {
  if (!Number.isInteger(score) || score < 3 || score > 15) {
    throw new RangeError(
      `RFM composite score must be an integer between 3 and 15, got: ${score}`,
    );
  }
  if (score >= 13) return 'excellent';
  if (score >= 10) return 'good';
  if (score >= 7) return 'average';
  if (score >= 5) return 'below-average';
  return 'poor';
}

// ─── Composite calculation ────────────────────────────────────────────────────

/**
 * Computes the full RFM breakdown for one customer's metrics.
 *
 * Scores each dimension independently via `scoreRecency`, `scoreFrequency`,
 * and `scoreMonetary`, sums them into a 3–15 composite, then calls
 * `getRFMTier` to resolve the named band.
 *
 * @param metrics - Raw recency/frequency/monetary inputs.
 * @param config - Optional per-dimension threshold overrides. Pass
 *   `{ monetary: 'INR' }` to switch to INR-calibrated monetary thresholds.
 * @returns Full `RFMBreakdown` with per-dimension scores, total (3–15), and tier.
 * @throws {RangeError} Propagated from any dimension scorer on invalid input.
 *
 * @example
 * calculateRFMScore({ daysSinceLastPurchase: 5, purchaseCount: 8, totalSpend: 600 })
 * // => { recency: 5, frequency: 4, monetary: 4, total: 13, tier: 'excellent' }
 *
 * calculateRFMScore(metrics, { monetary: 'INR' })
 * // Uses ₹ thresholds for monetary scoring
 */
export function calculateRFMScore(
  metrics: CustomerMetrics,
  config?: RFMConfig,
): RFMBreakdown {
  const recency = scoreRecency(metrics.daysSinceLastPurchase, config?.recency);
  const frequency = scoreFrequency(metrics.purchaseCount, config?.frequency);
  const monetary = scoreMonetary(metrics.totalSpend, config?.monetary);
  const total = recency + frequency + monetary;
  const tier = getRFMTier(total);
  return { recency, frequency, monetary, total, tier };
}
