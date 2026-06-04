import type { LoyaltyTier, TierInfo } from './types.js';

// ─── Tier table ───────────────────────────────────────────────────────────────

/**
 * Loyalty tier definitions.
 *
 * Points are earned via `calculatePoints(spend, multiplier)`.
 * `minPoints` is inclusive; `maxPoints` is the exclusive lower bound of the
 * next tier (null for platinum — no upper limit).
 *
 *   Bronze:   [0, 5000)   pts  — 1× multiplier
 *   Silver:   [5000, 15000)   — 1.5×
 *   Gold:     [15000, 30000)  — 2×
 *   Platinum: [30000, ∞)      — 3×
 */
const TIER_TABLE: Record<LoyaltyTier, TierInfo> = Object.freeze({
  bronze: Object.freeze({
    tier: 'bronze' as LoyaltyTier,
    label: 'Bronze Member',
    minPoints: 0,
    maxPoints: 5000,
    pointsMultiplier: 1,
    benefits: Object.freeze([
      'Earn 1 point per $1 / ₹1 spent',
      'Birthday discount coupon',
      'Access to member-only sales',
    ]),
  }),
  silver: Object.freeze({
    tier: 'silver' as LoyaltyTier,
    label: 'Silver Member',
    minPoints: 5000,
    maxPoints: 15000,
    pointsMultiplier: 1.5,
    benefits: Object.freeze([
      'Earn 1.5 points per $1 / ₹1 spent',
      'Free standard shipping on all orders',
      'Early access to sales (24 hours)',
      'Priority customer support',
    ]),
  }),
  gold: Object.freeze({
    tier: 'gold' as LoyaltyTier,
    label: 'Gold Member',
    minPoints: 15000,
    maxPoints: 30000,
    pointsMultiplier: 2,
    benefits: Object.freeze([
      'Earn 2 points per $1 / ₹1 spent',
      'Free express shipping on all orders',
      'Early access to sales (48 hours)',
      'Dedicated account manager',
      'Exclusive gold-tier promotions',
    ]),
  }),
  platinum: Object.freeze({
    tier: 'platinum' as LoyaltyTier,
    label: 'Platinum Member',
    minPoints: 30000,
    maxPoints: null,
    pointsMultiplier: 3,
    benefits: Object.freeze([
      'Earn 3 points per $1 / ₹1 spent',
      'Free next-day shipping on all orders',
      'First access to new products and launches',
      'Invitation to exclusive VIP events',
      'Dedicated concierge support',
      'Annual gift and surprise rewards',
    ]),
  }),
});

/** Ordered from lowest to highest — used for tier progression logic. */
const TIER_ORDER: readonly LoyaltyTier[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
] as const;

export { TIER_TABLE, TIER_ORDER };

// ─── Internal validation ──────────────────────────────────────────────────────

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${label} must be a finite non-negative number, got: ${value}`,
    );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the loyalty tier for a given lifetime points balance.
 *
 *   [0, 5000)   → 'bronze'
 *   [5000, 15000)  → 'silver'
 *   [15000, 30000) → 'gold'
 *   [30000, ∞)  → 'platinum'
 *
 * @param points - Customer's current lifetime points balance. Must be ≥ 0.
 * @returns The matched `LoyaltyTier`.
 * @throws {RangeError} If points is negative, NaN, or non-finite.
 */
export function getLoyaltyTier(points: number): LoyaltyTier {
  assertFiniteNonNegative(points, 'points');

  // Traverse from highest tier downward — first match wins
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = TIER_ORDER[i];
    if (tier !== undefined && points >= TIER_TABLE[tier].minPoints) {
      return tier;
    }
  }
  return 'bronze'; // unreachable: bronze.minPoints is 0, points ≥ 0 always matches
}

/**
 * Returns frozen tier metadata for a loyalty tier.
 *
 * @param tier - Any `LoyaltyTier` value.
 * @returns Frozen `TierInfo` — do not mutate.
 * @throws {RangeError} If an unknown tier string is passed at runtime.
 */
export function getTierInfo(tier: LoyaltyTier): TierInfo {
  const info = TIER_TABLE[tier];
  if (!info) {
    throw new RangeError(`Unknown loyalty tier: "${tier}"`);
  }
  return info;
}

/**
 * Converts a spend amount into loyalty points.
 *
 * Formula: `Math.floor(spend × multiplier)`
 *
 * Points are always whole numbers — partial points are never awarded.
 * The multiplier is typically taken from `getTierInfo(tier).pointsMultiplier`.
 *
 * @param spend - Non-negative spend amount (single transaction or period total).
 * @param multiplier - Earn rate. Must be finite and > 0. Defaults to 1.
 * @returns Non-negative whole number of points earned.
 * @throws {RangeError} If spend is negative, NaN, or non-finite.
 * @throws {RangeError} If multiplier is not a finite positive number.
 * @throws {RangeError} If spend × multiplier overflows to Infinity.
 *
 * @example
 * calculatePoints(199.99)        // => 199
 * calculatePoints(199.99, 1.5)   // => 299
 * calculatePoints(199.99, 2)     // => 399
 * calculatePoints(199.99, 3)     // => 599
 */
export function calculatePoints(spend: number, multiplier = 1): number {
  assertFiniteNonNegative(spend, 'spend');
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new RangeError(
      `multiplier must be a finite positive number, got: ${multiplier}`,
    );
  }
  const result = Math.floor(spend * multiplier);
  if (!Number.isFinite(result)) {
    throw new RangeError(
      `spend × multiplier overflows: ${spend} × ${multiplier} = ${spend * multiplier}`,
    );
  }
  return result;
}

/**
 * Returns how many more points a customer needs to reach the next tier.
 *
 * Returns `null` if the customer is already at 'platinum' (no higher tier).
 * Clamps to 0 — never returns a negative number (handles the case where
 * a customer's `points` already exceed the next tier boundary, e.g. due to
 * a tier label that hasn't been refreshed yet).
 *
 * @param points - Customer's current lifetime points balance. Must be ≥ 0.
 * @param tier - The customer's current tier.
 * @returns Points remaining to the next tier, or `null` if already at platinum.
 * @throws {RangeError} If points is negative, NaN, or non-finite.
 * @throws {RangeError} If an unknown tier string is passed at runtime.
 *
 * @example
 * pointsToNextTier(3500, 'bronze')     // => 1500
 * pointsToNextTier(5000, 'bronze')     // => 0  (already at silver boundary)
 * pointsToNextTier(999999, 'platinum') // => null
 */
export function pointsToNextTier(
  points: number,
  tier: LoyaltyTier,
): number | null {
  assertFiniteNonNegative(points, 'points');

  const currentIndex = TIER_ORDER.indexOf(tier);
  if (currentIndex === -1) {
    throw new RangeError(`Unknown loyalty tier: "${tier}"`);
  }

  const nextTierKey = TIER_ORDER[currentIndex + 1];
  if (nextTierKey === undefined) {
    return null; // already at the top
  }

  const nextTier = TIER_TABLE[nextTierKey];
  return Math.max(0, nextTier.minPoints - points);
}
