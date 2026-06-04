import { calculateRFMScore } from './rfm.js';
import type {
  Customer,
  CustomerSegment,
  RFMBreakdown,
  RFMConfig,
  SegmentedCustomer,
  SegmentInfo,
} from './types.js';

// ─── Segment grid ─────────────────────────────────────────────────────────────

/**
 * Assigns a behavioral segment from an RFM breakdown using a first-match grid.
 *
 * Rules — highest-value segment first:
 *
 *   champions            R≥4, F≥4, M≥4
 *   cant-lose-them       R≤2, F=5  (once best; now gone quiet)
 *   loyal-customers      F≥3, M≥3  (not champions)
 *   at-risk              R≤2, F≥3  (frequent but lapsing)
 *   new-customers        R=5, F=1
 *   promising            R=4, F=1
 *   potential-loyalists  R≥4, F=2  OR  R=3, F≤2, M≥3
 *   about-to-sleep       R=3, F≤2, M<3
 *   needs-attention      R≥3, F≥3, M<3  (active/frequent but low-value)
 *   hibernating          R=2, F≤2
 *   lost                 R=1, F≤2  (catch-all for fully lapsed low-frequency)
 *
 * Every possible (R, F, M) combination maps to exactly one segment.
 *
 * @param rfm - A breakdown produced by `calculateRFMScore` (or hand-constructed).
 * @returns The matched `CustomerSegment`.
 */
export function segmentCustomer(rfm: RFMBreakdown): CustomerSegment {
  const { recency: R, frequency: F, monetary: M } = rfm;

  // ── Tier 1: highest value ────────────────────────────────────────────────
  // All three dimensions strong
  if (R >= 4 && F >= 4 && M >= 4) return 'champions';

  // ── Tier 2: must act immediately ─────────────────────────────────────────
  // Very frequent buyers who have gone silent (R low) — top priority to save
  if (R <= 2 && F === 5) return 'cant-lose-them';

  // ── Tier 3: regular value base ────────────────────────────────────────────
  // Buys often and spends well (but not quite champion level)
  if (F >= 3 && M >= 3) return 'loyal-customers';

  // ── Tier 4: churn risk ────────────────────────────────────────────────────
  // Was buying frequently but recency has dropped — intervention needed
  if (R <= 2 && F >= 3) return 'at-risk';

  // ── Tier 5: recent, low-frequency ─────────────────────────────────────────
  // R≥3, F≤2: bought recently but not yet a habit
  if (R >= 3 && F <= 2) {
    if (R === 5 && F === 1) return 'new-customers';
    if (R === 4 && F === 1) return 'promising';
    // R=4/F=2 or R=5/F=2 — strong recency, growing frequency
    if (R >= 4) return 'potential-loyalists';
    // R=3, F≤2: still recent — spend level decides whether to invest or nudge
    if (M >= 3) return 'potential-loyalists'; // decent spend, worth nurturing
    return 'about-to-sleep';                  // low spend + fading recency
  }

  // ── Tier 6: active/frequent but low-value ─────────────────────────────────
  // R≥3, F≥3, M<3: engaged customers with untapped spend potential.
  // NOT champions/loyal-customers (M<3), NOT at-risk (R>2).
  // Upsell opportunity — "needs-attention" is the closest fit.
  if (R >= 3 && F >= 3) return 'needs-attention';

  // ── Tier 7: dormant, low-frequency ────────────────────────────────────────
  // R=2, F≤2: not far gone, but slipping — one last campaign may help
  if (R === 2 && F <= 2) return 'hibernating';

  // ── Catch-all: fully lapsed ────────────────────────────────────────────────
  // R=1, F≤2 (all remaining cases): long gone, rarely bought
  return 'lost';
}

/**
 * Batch-scores and segments a list of customers.
 *
 * Input array and objects are never mutated; output order matches input order.
 * Supports the same `RFMConfig` as `calculateRFMScore`, including the
 * `{ monetary: 'INR' }` currency preset shorthand.
 *
 * @param customers - Array of customer records with raw metrics.
 * @param config - Optional RFM threshold overrides applied to every customer.
 * @returns One `SegmentedCustomer` per input, in the same order.
 * @throws {RangeError} On the first customer with invalid metrics;
 *   the error message includes the offending customer's `id`.
 */
export function segmentCustomers(
  customers: readonly Customer[],
  config?: RFMConfig,
): SegmentedCustomer[] {
  return customers.map((customer) => {
    let rfm: RFMBreakdown;
    try {
      rfm = calculateRFMScore(customer, config);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new RangeError(`Customer "${customer.id}": ${msg}`);
    }
    const segment = segmentCustomer(rfm);
    return { ...customer, rfm, segment };
  });
}

// ─── Segment metadata ─────────────────────────────────────────────────────────

const SEGMENT_INFO_TABLE: Record<CustomerSegment, SegmentInfo> = Object.freeze({
  champions: Object.freeze({
    segment: 'champions' as CustomerSegment,
    label: 'Champions',
    description:
      'Your best customers — bought recently, buy often, and spend the most.',
    recommendedActions: Object.freeze([
      'Reward with early access and VIP perks',
      'Ask for reviews and referrals',
      'Offer loyalty program upgrades',
      'Send exclusive product previews',
    ]),
  }),
  'loyal-customers': Object.freeze({
    segment: 'loyal-customers' as CustomerSegment,
    label: 'Loyal Customers',
    description: 'Regular buyers with solid spend — a dependable revenue base.',
    recommendedActions: Object.freeze([
      'Upsell higher-value products or bundles',
      'Enroll in a loyalty or subscription program',
      'Request product feedback and reviews',
      'Offer referral incentives',
    ]),
  }),
  'potential-loyalists': Object.freeze({
    segment: 'potential-loyalists' as CustomerSegment,
    label: 'Potential Loyalists',
    description:
      "Recent buyers who haven't yet purchased frequently — strong conversion opportunity.",
    recommendedActions: Object.freeze([
      'Send personalised follow-up offers',
      'Introduce loyalty program benefits',
      'Offer subscription or repeat-purchase discounts',
      'Highlight complementary products',
    ]),
  }),
  'new-customers': Object.freeze({
    segment: 'new-customers' as CustomerSegment,
    label: 'New Customers',
    description: 'Made their first purchase very recently.',
    recommendedActions: Object.freeze([
      'Send a welcome series with onboarding tips',
      'Offer a second-purchase discount',
      'Showcase popular and best-rated products',
      'Invite to join the loyalty program',
    ]),
  }),
  promising: Object.freeze({
    segment: 'promising' as CustomerSegment,
    label: 'Promising',
    description: "Recent first-time buyers who haven't returned yet.",
    recommendedActions: Object.freeze([
      'Nurture with targeted content and offers',
      'Send a timed follow-up discount',
      'Highlight new arrivals relevant to first purchase',
    ]),
  }),
  'needs-attention': Object.freeze({
    segment: 'needs-attention' as CustomerSegment,
    label: 'Needs Attention',
    description:
      'Active and fairly frequent buyers, but spending below their potential.',
    recommendedActions: Object.freeze([
      'Send a personalised upsell or bundle offer',
      'Introduce a tiered loyalty program to incentivise higher spend',
      'Remind them of items in cart or wishlist',
      'Offer a limited-time spend-threshold reward',
    ]),
  }),
  'about-to-sleep': Object.freeze({
    segment: 'about-to-sleep' as CustomerSegment,
    label: 'About to Sleep',
    description: 'Recency is falling with low purchase history — act now.',
    recommendedActions: Object.freeze([
      'Send a win-back offer before they go cold',
      "Highlight what's new since their last visit",
      'Use urgency: limited stock or expiring points',
    ]),
  }),
  'at-risk': Object.freeze({
    segment: 'at-risk' as CustomerSegment,
    label: 'At Risk',
    description:
      "Were frequent buyers but haven't purchased in a while — churn is imminent.",
    recommendedActions: Object.freeze([
      'Send a personalised win-back campaign',
      'Offer a significant discount or bonus points',
      'Ask directly what would bring them back',
      'Highlight improvements since their last purchase',
    ]),
  }),
  'cant-lose-them': Object.freeze({
    segment: 'cant-lose-them' as CustomerSegment,
    label: "Can't Lose Them",
    description:
      "Historically your most frequent buyers, but they haven't returned recently.",
    recommendedActions: Object.freeze([
      'Reach out personally — phone or priority email',
      'Offer a top-tier re-engagement incentive',
      'Ask for feedback: what went wrong?',
      'Assign to an account manager if B2B',
    ]),
  }),
  hibernating: Object.freeze({
    segment: 'hibernating' as CustomerSegment,
    label: 'Hibernating',
    description: 'Low recency, low frequency — largely inactive.',
    recommendedActions: Object.freeze([
      'Send a "we miss you" campaign with a steep discount',
      'Share social proof and new product launches',
      'Consider suppressing from regular campaigns to reduce fatigue',
    ]),
  }),
  lost: Object.freeze({
    segment: 'lost' as CustomerSegment,
    label: 'Lost',
    description:
      "Haven't purchased in a very long time, and rarely bought when they did.",
    recommendedActions: Object.freeze([
      'Low-cost mass win-back campaign as a last attempt',
      'Survey to understand why they left',
      'Remove from active marketing lists to reduce cost',
    ]),
  }),
});

/**
 * Returns display metadata for a segment: label, description, and recommended
 * marketing actions. The result is frozen — do not mutate it.
 *
 * @param segment - Any `CustomerSegment` value.
 * @returns Frozen `SegmentInfo`.
 * @throws {RangeError} If an unknown segment string is passed at runtime.
 */
export function getSegmentInfo(segment: CustomerSegment): SegmentInfo {
  const info = SEGMENT_INFO_TABLE[segment];
  if (!info) {
    throw new RangeError(`Unknown customer segment: "${segment}"`);
  }
  return info;
}

/** All valid `CustomerSegment` values in display order (highest to lowest value). */
const ALL_SEGMENTS: readonly CustomerSegment[] = [
  'champions',
  'loyal-customers',
  'potential-loyalists',
  'new-customers',
  'promising',
  'needs-attention',
  'about-to-sleep',
  'at-risk',
  'cant-lose-them',
  'hibernating',
  'lost',
] as const;

/**
 * Counts customers per segment.
 *
 * Every segment key is always present — zero-filled even if no customer
 * belongs to it — so dashboard charts never encounter `undefined`.
 *
 * @param customers - Already-segmented customers (from `segmentCustomers`).
 * @returns Complete record mapping every `CustomerSegment` to a count.
 *
 * @example
 * getSegmentDistribution([])
 * // => { champions: 0, 'loyal-customers': 0, ..., lost: 0 }
 */
export function getSegmentDistribution(
  customers: readonly SegmentedCustomer[],
): Record<CustomerSegment, number> {
  const dist = Object.fromEntries(
    ALL_SEGMENTS.map((s) => [s, 0]),
  ) as Record<CustomerSegment, number>;

  for (const customer of customers) {
    dist[customer.segment] += 1;
  }

  return dist;
}

export { SEGMENT_INFO_TABLE, ALL_SEGMENTS };
