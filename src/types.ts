// ─── Score primitives ────────────────────────────────────────────────────────

/** A single RFM dimension score. 5 is best, 1 is worst. */
export type RFMScore = 1 | 2 | 3 | 4 | 5;

/** Named quality band derived from the composite RFM score (3–15). */
export type RFMTier =
  | 'excellent'      // 13–15
  | 'good'           // 10–12
  | 'average'        // 7–9
  | 'below-average'  // 5–6
  | 'poor';          // 3–4

// ─── Segmentation ────────────────────────────────────────────────────────────

/**
 * Behavioral segment derived from R×F×M grid scoring.
 * Segments are ordered from highest to lowest customer value.
 */
export type CustomerSegment =
  | 'champions'
  | 'loyal-customers'
  | 'potential-loyalists'
  | 'new-customers'
  | 'promising'
  | 'needs-attention'
  | 'about-to-sleep'
  | 'at-risk'
  | 'cant-lose-them'
  | 'hibernating'
  | 'lost';

// ─── Loyalty ─────────────────────────────────────────────────────────────────

/** Loyalty program tier, ordered ascending by value. */
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// ─── Input shapes ────────────────────────────────────────────────────────────

/** Raw behavioral metrics for one customer. */
export interface CustomerMetrics {
  /** Days since the customer's most recent purchase. Must be ≥ 0. */
  daysSinceLastPurchase: number;
  /** Total number of completed purchases. Must be a non-negative integer. */
  purchaseCount: number;
  /** Total spend in the platform's currency major unit. Must be ≥ 0. */
  totalSpend: number;
}

/** A customer record fed to batch operations. */
export interface Customer extends CustomerMetrics {
  /** Stable identifier, passed through untouched on all output shapes. */
  id: string;
}

// ─── RFM output shapes ───────────────────────────────────────────────────────

/** Full RFM result: per-dimension scores, composite total, and named tier. */
export interface RFMBreakdown {
  recency: RFMScore;
  frequency: RFMScore;
  monetary: RFMScore;
  /** Sum of the three dimension scores: 3–15. */
  total: number;
  /** Named quality band for `total`. */
  tier: RFMTier;
}

// ─── Segmentation output shapes ──────────────────────────────────────────────

/** A customer enriched with computed RFM scores and a behavioral segment. */
export interface SegmentedCustomer extends Customer {
  rfm: RFMBreakdown;
  segment: CustomerSegment;
}

/** Human-readable metadata about a segment, for dashboard/CRM display. */
export interface SegmentInfo {
  segment: CustomerSegment;
  /** Display label, e.g. "Champions". */
  label: string;
  /** One-sentence description of the behavior pattern. */
  description: string;
  /** Suggested marketing actions, ordered by priority. */
  recommendedActions: readonly string[];
}

// ─── Loyalty output shapes ───────────────────────────────────────────────────

/** Metadata about a loyalty tier. */
export interface TierInfo {
  tier: LoyaltyTier;
  /** Display label, e.g. "Gold Member". */
  label: string;
  /** Minimum lifetime points to qualify for this tier (inclusive). */
  minPoints: number;
  /**
   * Minimum points for the NEXT tier (exclusive upper bound for this tier).
   * `null` for the top tier (platinum) — no upper limit.
   */
  maxPoints: number | null;
  /** Points earned per major currency unit at this tier. */
  pointsMultiplier: number;
  /** Display-ready benefit descriptions. */
  benefits: readonly string[];
}

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Four strictly-ascending boundary values that divide the 1–5 score range.
 * All values must be finite and non-negative.
 * Interpreted differently per dimension — see each scoring function's JSDoc.
 */
export interface ScoreThresholds {
  boundaries: readonly [number, number, number, number];
}

/** Currency presets for monetary scoring thresholds. */
export type CurrencyPreset = 'USD' | 'INR';

/**
 * Optional per-dimension threshold overrides for RFM scoring functions.
 *
 * `monetary` accepts either a `ScoreThresholds` object or a `CurrencyPreset`
 * string ('USD' | 'INR') as a convenience shorthand.
 */
export interface RFMConfig {
  /** Recency thresholds (days — lower is better). */
  recency?: ScoreThresholds;
  /** Frequency thresholds (count — higher is better). */
  frequency?: ScoreThresholds;
  /**
   * Monetary thresholds. Pass `ScoreThresholds` for full control, or a
   * `CurrencyPreset` string ('USD' | 'INR') to use built-in calibrations.
   */
  monetary?: ScoreThresholds | CurrencyPreset;
}
