// ─── Public types ─────────────────────────────────────────────────────────────
export type {
  RFMScore,
  RFMTier,
  CustomerSegment,
  LoyaltyTier,
  CustomerMetrics,
  Customer,
  RFMBreakdown,
  SegmentedCustomer,
  SegmentInfo,
  TierInfo,
  ScoreThresholds,
  RFMConfig,
  CurrencyPreset,
} from './types.js';

// ─── RFM module ───────────────────────────────────────────────────────────────
export {
  scoreRecency,
  scoreFrequency,
  scoreMonetary,
  calculateRFMScore,
  getRFMTier,
  DEFAULT_RFM_CONFIG,
  CURRENCY_PRESETS,
} from './rfm.js';

// ─── Segmentation module ──────────────────────────────────────────────────────
export {
  segmentCustomer,
  segmentCustomers,
  getSegmentInfo,
  getSegmentDistribution,
  SEGMENT_INFO_TABLE,
  ALL_SEGMENTS,
} from './segments.js';

// ─── Loyalty module ───────────────────────────────────────────────────────────
export {
  getLoyaltyTier,
  getTierInfo,
  calculatePoints,
  pointsToNextTier,
  TIER_TABLE,
  TIER_ORDER,
} from './loyalty.js';
